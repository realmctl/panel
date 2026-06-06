<?php

namespace Pterodactyl\Http\Controllers\Admin\Subdomains;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Subdomain\Domain;
use Pterodactyl\Models\Subdomain\EggRecord;
use Pterodactyl\Models\Subdomain\Record;
use Pterodactyl\Http\Controllers\Controller;

class RecordController extends Controller
{
    public function __construct(private AlertsMessageBag $alert)
    {
    }

    public function index()
    {
        return view('admin.subdomains.records.index', [
            'records' => Record::query()->with('domain')->orderBy('name')->paginate(25),
        ]);
    }

    public function create()
    {
        return view('admin.subdomains.records.new', [
            'domains' => Domain::query()->orderBy('name')->get(),
            'eggs' => Egg::query()->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:SRV,CNAME',
            'domain_id' => 'required|integer|exists:domains,id',
            'egg_ids' => 'required|array|min:1',
            'egg_ids.*' => 'integer|exists:eggs,id',
            'ttl' => 'required_if:type,SRV|nullable|string',
            'protocol' => 'required_if:type,SRV|nullable|string',
            'priority' => 'required_if:type,SRV|nullable|string',
            'weight' => 'required_if:type,SRV|nullable|string',
            'service' => 'required_if:type,SRV|nullable|string',
        ]);

        $record = Record::query()->create($request->only([
            'name', 'type', 'domain_id', 'ttl', 'protocol', 'priority', 'weight', 'service',
        ]));

        foreach ($request->input('egg_ids') as $eggId) {
            EggRecord::query()->create([
                'record_id' => $record->id,
                'egg_id' => $eggId,
            ]);
        }

        $this->alert->success('Record template added successfully.')->flash();

        return redirect()->route('admin.subdomains.records.index');
    }

    public function edit(Record $record)
    {
        return view('admin.subdomains.records.edit', [
            'record' => $record,
            'domains' => Domain::query()->orderBy('name')->get(),
            'eggs' => Egg::query()->orderBy('name')->get(),
            'selectedEggs' => $record->eggRecords()->pluck('egg_id')->all(),
        ]);
    }

    public function update(Record $record, Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:SRV,CNAME',
            'domain_id' => 'required|integer|exists:domains,id',
            'egg_ids' => 'required|array|min:1',
            'egg_ids.*' => 'integer|exists:eggs,id',
            'ttl' => 'required_if:type,SRV|nullable|string',
            'protocol' => 'required_if:type,SRV|nullable|string',
            'priority' => 'required_if:type,SRV|nullable|string',
            'weight' => 'required_if:type,SRV|nullable|string',
            'service' => 'required_if:type,SRV|nullable|string',
        ]);

        $record->fill($request->only([
            'name', 'type', 'domain_id', 'ttl', 'protocol', 'priority', 'weight', 'service',
        ]));
        $record->save();

        EggRecord::query()->where('record_id', $record->id)->delete();
        foreach ($request->input('egg_ids') as $eggId) {
            EggRecord::query()->create([
                'record_id' => $record->id,
                'egg_id' => $eggId,
            ]);
        }

        $this->alert->success('Record template updated successfully.')->flash();

        return redirect()->route('admin.subdomains.records.index');
    }

    public function destroy(Record $record): Response
    {
        $record->eggRecords()->delete();
        $record->delete();

        return response('', 204);
    }
}
