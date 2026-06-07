<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Realm\Http\Controllers\Controller;
use Realm\Models\Egg;
use Realm\Models\Subdomain\Domain;
use Realm\Models\Subdomain\EggRecord;
use Realm\Models\Subdomain\Record;

class SubdomainRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $paginator = Record::query()
            ->with('domain')
            ->orderBy('name')
            ->paginate(25, ['*'], 'page', $request->integer('page', 1));

        return response()->json([
            'records' => collect($paginator->items())->map(fn (Record $record) => [
                'id' => $record->id,
                'name' => $record->name,
                'type' => $record->type,
                'domain' => [
                    'id' => $record->domain->id,
                    'name' => $record->domain->name,
                ],
            ])->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function create(): JsonResponse
    {
        return response()->json([
            'domains' => Domain::query()->orderBy('name')->get(['id', 'name']),
            'eggs' => Egg::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): JsonResponse
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

        return response()->json([
            'success' => true,
            'message' => 'Record template added successfully.',
            'record' => ['id' => $record->id],
        ], 201);
    }

    public function show(Record $record): JsonResponse
    {
        $record->load('domain');

        return response()->json([
            'record' => [
                'id' => $record->id,
                'name' => $record->name,
                'type' => $record->type,
                'domain_id' => $record->domain_id,
                'ttl' => $record->ttl,
                'protocol' => $record->protocol,
                'priority' => $record->priority,
                'weight' => $record->weight,
                'service' => $record->service,
            ],
            'domains' => Domain::query()->orderBy('name')->get(['id', 'name']),
            'eggs' => Egg::query()->orderBy('name')->get(['id', 'name']),
            'egg_ids' => $record->eggRecords()->pluck('egg_id')->all(),
        ]);
    }

    public function update(Record $record, Request $request): JsonResponse
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

        return response()->json([
            'success' => true,
            'message' => 'Record template updated successfully.',
        ]);
    }

    public function destroy(Record $record): Response
    {
        $record->eggRecords()->delete();
        $record->delete();

        return response('', 204);
    }
}
