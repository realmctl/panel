<div class="card">
    <div class="card-body">
        <div class="mb-3">
            <label class="form-label">Name</label>
            <input required type="text" name="name" class="form-control" value="{{ old('name', $record->name ?? '') }}" />
            <span class="form-hint">Visible to customers when creating a subdomain.</span>
        </div>
        <div class="mb-3">
            <label class="form-label">Domain</label>
            <select name="domain_id" class="form-select">
                @foreach ($domains as $domain)
                    <option value="{{ $domain->id }}" @selected(old('domain_id', $record->domain_id ?? null) == $domain->id)>{{ $domain->name }}</option>
                @endforeach
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Eggs</label>
            <span class="form-hint d-block mb-2">Servers only see templates linked to their egg. Select every egg that should be allowed to create this subdomain type.</span>
            <select name="egg_ids[]" class="form-select" multiple id="egg-select">
                @foreach ($eggs as $egg)
                    <option value="{{ $egg->id }}" @selected(in_array($egg->id, old('egg_ids', $selectedEggs ?? [])))>{{ $egg->name }}</option>
                @endforeach
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Type</label>
            <select name="type" class="form-select" id="record-type">
                <option value="SRV" @selected(old('type', $record->type ?? 'SRV') === 'SRV')>SRV</option>
                <option value="CNAME" @selected(old('type', $record->type ?? '') === 'CNAME')>CNAME</option>
            </select>
        </div>
        <div id="srv-fields">
            <div class="mb-3">
                <label class="form-label">TTL</label>
                <input type="text" name="ttl" id="ttl" class="form-control" value="{{ old('ttl', $record->ttl ?? '3600') }}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Protocol</label>
                <select name="protocol" id="protocol" class="form-select">
                    <option value="tcp" @selected(old('protocol', $record->protocol ?? 'tcp') === 'tcp')>TCP</option>
                    <option value="udp" @selected(old('protocol', $record->protocol ?? '') === 'udp')>UDP</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Priority</label>
                <input type="text" name="priority" id="priority" class="form-control" value="{{ old('priority', $record->priority ?? '0') }}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Weight</label>
                <input type="text" name="weight" id="weight" class="form-control" value="{{ old('weight', $record->weight ?? '5') }}" />
            </div>
            <div class="mb-3">
                <label class="form-label">Service</label>
                <input type="text" name="service" id="service" class="form-control" value="{{ old('service', $record->service ?? '_minecraft') }}" />
            </div>
        </div>
    </div>
</div>

