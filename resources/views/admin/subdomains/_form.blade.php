<div class="card">
    <div class="card-body">
        <div class="mb-3">
            <label class="form-label">Domain name</label>
            <input required type="text" name="name" class="form-control" value="{{ old('name', $domain->name ?? '') }}" />
        </div>
        <div class="mb-3">
            <label class="form-label">Provider</label>
            <select name="type" class="form-select" id="provider-type">
                @foreach ($providers as $key => $provider)
                    <option value="{{ $key }}" @selected(old('type', $domain->type ?? 'cloudflare') === $key)>{{ $provider['title'] }}</option>
                @endforeach
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Key / API Token</label>
            <input required type="text" name="key" class="form-control" value="{{ old('key') }}" />
            <span class="form-hint">Re-enter credentials when editing. Values are stored encrypted.</span>
        </div>
        <div class="mb-3" id="field-secret">
            <label class="form-label">Secret</label>
            <input type="text" name="secret" class="form-control" value="{{ old('secret') }}" />
        </div>
        <div class="mb-3" id="field-consumer">
            <label class="form-label">Consumer Key</label>
            <input type="text" name="consumer" class="form-control" value="{{ old('consumer') }}" />
        </div>
        <div class="mb-3" id="field-cloudflare-id">
            <label class="form-label">Cloudflare Zone ID</label>
            <input type="text" name="cloudflare_id" class="form-control" value="{{ old('cloudflare_id', $domain->cloudflare_id ?? '') }}" />
        </div>
        <div class="mb-3" id="field-ovh-api">
            <label class="form-label">OVH API Region</label>
            <select name="ovh_api" class="form-select">
                <option value="eu" @selected(old('ovh_api', $domain->ovh_api ?? 'eu') === 'eu')>EU</option>
                <option value="us" @selected(old('ovh_api', $domain->ovh_api ?? '') === 'us')>US</option>
                <option value="ca" @selected(old('ovh_api', $domain->ovh_api ?? '') === 'ca')>CA</option>
            </select>
        </div>
    </div>
</div>
