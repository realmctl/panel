<?php

namespace Pterodactyl\Http\Controllers\Admin\Subdomains;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Models\Subdomain\Domain;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Subdomains\Dns\DnsProviderRegistry;

class DomainController extends Controller
{
    public function __construct(private AlertsMessageBag $alert)
    {
    }

    public function index()
    {
        return view('admin.subdomains.index', [
            'domains' => Domain::query()->orderBy('name')->get(),
        ]);
    }

    public function create()
    {
        return view('admin.subdomains.new', [
            'providers' => DnsProviderRegistry::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', array_keys(DnsProviderRegistry::all())),
            'key' => 'required|string',
        ]);

        $domain = new Domain();
        $domain->fill([
            'name' => $request->input('name'),
            'type' => $request->input('type'),
            'display_type' => DnsProviderRegistry::title($request->input('type')),
            'key' => encrypt($request->input('key')),
            'secret' => $request->filled('secret') ? encrypt($request->input('secret')) : null,
            'consumer' => $request->filled('consumer') ? encrypt($request->input('consumer')) : null,
            'cloudflare_id' => $request->input('cloudflare_id'),
            'ovh_api' => $request->input('ovh_api'),
        ]);
        $domain->save();

        $this->alert->success('Domain added successfully.')->flash();

        return redirect()->route('admin.subdomains.index');
    }

    public function edit(Domain $domain)
    {
        return view('admin.subdomains.edit', [
            'domain' => $domain,
            'providers' => DnsProviderRegistry::all(),
        ]);
    }

    public function update(Domain $domain, Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', array_keys(DnsProviderRegistry::all())),
            'key' => 'required|string',
        ]);

        $domain->fill([
            'name' => $request->input('name'),
            'type' => $request->input('type'),
            'display_type' => DnsProviderRegistry::title($request->input('type')),
            'key' => encrypt($request->input('key')),
            'secret' => $request->filled('secret') ? encrypt($request->input('secret')) : null,
            'consumer' => $request->filled('consumer') ? encrypt($request->input('consumer')) : null,
            'cloudflare_id' => $request->input('cloudflare_id'),
            'ovh_api' => $request->input('ovh_api'),
        ]);
        $domain->save();

        $this->alert->success('Domain updated successfully.')->flash();

        return redirect()->route('admin.subdomains.index');
    }

    public function destroy(Domain $domain): Response
    {
        $domain->load('records');
        $domain->subdomains()->delete();
        foreach ($domain->records as $record) {
            $record->eggRecords()->delete();
            $record->delete();
        }
        $domain->delete();

        return response('', 204);
    }
}
