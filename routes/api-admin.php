<?php

use Illuminate\Support\Facades\Route;
use Realm\Http\Controllers\Api\Admin\ApplicationApiController;
use Realm\Http\Controllers\Api\Admin\OverviewController;
use Realm\Http\Controllers\Api\Admin\BackupDestinationController;
use Realm\Http\Controllers\Api\Admin\DatabaseHostController;
use Realm\Http\Controllers\Api\Admin\LocationController;
use Realm\Http\Controllers\Api\Admin\NodeController;
use Realm\Http\Controllers\Api\Admin\ServerController;
use Realm\Http\Controllers\Api\Admin\SettingsController;
use Realm\Http\Controllers\Api\Admin\EggController;
use Realm\Http\Controllers\Api\Admin\EggScriptController;
use Realm\Http\Controllers\Api\Admin\EggVariableController;
use Realm\Http\Controllers\Api\Admin\MountController;
use Realm\Http\Controllers\Api\Admin\NestController;
use Realm\Http\Controllers\Api\Admin\SubdomainDomainController;
use Realm\Http\Controllers\Api\Admin\SubdomainRecordController;
use Realm\Http\Controllers\Api\Admin\UserController;

Route::get('/overview', [OverviewController::class, 'index']);

Route::get('/settings', [SettingsController::class, 'index']);
Route::patch('/settings/general', [SettingsController::class, 'updateGeneral']);

Route::get('/settings/mail', [SettingsController::class, 'mail']);
Route::patch('/settings/mail', [SettingsController::class, 'updateMail']);
Route::post('/settings/mail/test', [SettingsController::class, 'testMail']);

Route::get('/settings/security', [SettingsController::class, 'security']);
Route::patch('/settings/security', [SettingsController::class, 'updateSecurity']);

Route::get('/settings/oauth', [SettingsController::class, 'oauth']);
Route::patch('/settings/oauth', [SettingsController::class, 'updateOAuth']);

Route::get('/settings/mappings', [SettingsController::class, 'mappings']);
Route::patch('/settings/mappings', [SettingsController::class, 'updateMappings']);

Route::get('/settings/advanced', [SettingsController::class, 'advanced']);
Route::patch('/settings/advanced', [SettingsController::class, 'updateAdvanced']);

Route::get('/application-api', [ApplicationApiController::class, 'index']);
Route::get('/application-api/create', [ApplicationApiController::class, 'create']);
Route::post('/application-api', [ApplicationApiController::class, 'store']);
Route::delete('/application-api/{identifier}', [ApplicationApiController::class, 'delete']);

Route::get('/locations', [LocationController::class, 'index']);
Route::post('/locations', [LocationController::class, 'store']);
Route::get('/locations/{location}', [LocationController::class, 'show']);
Route::patch('/locations/{location}', [LocationController::class, 'update']);
Route::delete('/locations/{location}', [LocationController::class, 'destroy']);

Route::get('/backup-destinations', [BackupDestinationController::class, 'index']);
Route::post('/backup-destinations', [BackupDestinationController::class, 'store']);
Route::get('/backup-destinations/{backup_destination}', [BackupDestinationController::class, 'show']);
Route::patch('/backup-destinations/{backup_destination}', [BackupDestinationController::class, 'update']);
Route::delete('/backup-destinations/{backup_destination}', [BackupDestinationController::class, 'destroy']);

Route::get('/database-hosts', [DatabaseHostController::class, 'index']);
Route::get('/database-hosts/create', [DatabaseHostController::class, 'create']);
Route::post('/database-hosts', [DatabaseHostController::class, 'store']);
Route::get('/database-hosts/{host}', [DatabaseHostController::class, 'show']);
Route::patch('/database-hosts/{host}', [DatabaseHostController::class, 'update']);
Route::delete('/database-hosts/{host}', [DatabaseHostController::class, 'destroy']);

Route::get('/nodes', [NodeController::class, 'index']);
Route::get('/nodes/create', [NodeController::class, 'create']);
Route::post('/nodes', [NodeController::class, 'store']);
Route::get('/nodes/{node:id}/allocations', [NodeController::class, 'allocations']);
Route::post('/nodes/{node:id}/allocations', [NodeController::class, 'storeAllocation']);
Route::patch('/nodes/{node:id}/allocations/alias', [NodeController::class, 'updateAllocationAlias']);
Route::delete('/nodes/{node:id}/allocations/block', [NodeController::class, 'destroyAllocationBlock']);
Route::delete('/nodes/{node:id}/allocations/{allocation:id}', [NodeController::class, 'destroyAllocation']);
Route::delete('/nodes/{node:id}/allocations', [NodeController::class, 'destroyAllocations']);
Route::get('/nodes/{node:id}/health', [NodeController::class, 'health']);
Route::get('/nodes/{node:id}', [NodeController::class, 'show']);
Route::get('/nodes/{node:id}/system-information', [NodeController::class, 'systemInformation']);
Route::get('/nodes/{node:id}/settings', [NodeController::class, 'settings']);
Route::patch('/nodes/{node:id}/settings', [NodeController::class, 'updateSettings']);
Route::get('/nodes/{node:id}/configuration', [NodeController::class, 'configuration']);
Route::post('/nodes/{node:id}/deploy-token', [NodeController::class, 'deployToken']);
Route::get('/nodes/{node:id}/servers', [NodeController::class, 'servers']);
Route::delete('/nodes/{node:id}', [NodeController::class, 'destroy']);

Route::get('/servers/create', [ServerController::class, 'create']);
Route::post('/servers', [ServerController::class, 'store']);
Route::get('/servers', [ServerController::class, 'index']);
Route::get('/servers/{server:id}', [ServerController::class, 'show']);
Route::post('/servers/{server:id}/duplicate', [ServerController::class, 'duplicate']);
Route::delete('/servers/{server:id}', [ServerController::class, 'destroy']);

Route::get('/servers/{server:id}/details', [ServerController::class, 'details']);
Route::patch('/servers/{server:id}/details', [ServerController::class, 'updateDetails']);

Route::get('/servers/{server:id}/build', [ServerController::class, 'build']);
Route::patch('/servers/{server:id}/build', [ServerController::class, 'updateBuild']);

Route::get('/servers/{server:id}/startup', [ServerController::class, 'startup']);
Route::patch('/servers/{server:id}/startup', [ServerController::class, 'updateStartup']);

Route::get('/servers/{server:id}/databases', [ServerController::class, 'databases']);
Route::post('/servers/{server:id}/databases', [ServerController::class, 'storeDatabase']);
Route::patch('/servers/{server:id}/databases/reset-password', [ServerController::class, 'resetDatabasePassword']);
Route::delete('/servers/{server:id}/databases/{database:id}', [ServerController::class, 'destroyDatabase']);

Route::get('/servers/{server:id}/mounts', [ServerController::class, 'mounts']);
Route::post('/servers/{server:id}/mounts', [ServerController::class, 'storeMount']);
Route::delete('/servers/{server:id}/mounts/{mount:id}', [ServerController::class, 'destroyMount']);

Route::get('/servers/{server:id}/manage', [ServerController::class, 'manage']);
Route::post('/servers/{server:id}/reinstall', [ServerController::class, 'reinstall']);
Route::post('/servers/{server:id}/toggle-install', [ServerController::class, 'toggleInstall']);
Route::post('/servers/{server:id}/suspend', [ServerController::class, 'suspend']);
Route::post('/servers/{server:id}/transfer', [ServerController::class, 'transfer']);

Route::get('/users', [UserController::class, 'index']);
Route::get('/users/create', [UserController::class, 'create']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/search', [UserController::class, 'search']);
Route::get('/users/{user:id}', [UserController::class, 'show']);
Route::patch('/users/{user:id}', [UserController::class, 'update']);
Route::delete('/users/{user:id}', [UserController::class, 'destroy']);

Route::get('/subdomains/domains', [SubdomainDomainController::class, 'index']);
Route::get('/subdomains/domains/create', [SubdomainDomainController::class, 'create']);
Route::post('/subdomains/domains', [SubdomainDomainController::class, 'store']);
Route::get('/subdomains/domains/{domain:id}', [SubdomainDomainController::class, 'show']);
Route::patch('/subdomains/domains/{domain:id}', [SubdomainDomainController::class, 'update']);
Route::delete('/subdomains/domains/{domain:id}', [SubdomainDomainController::class, 'destroy']);

Route::get('/subdomains/records', [SubdomainRecordController::class, 'index']);
Route::get('/subdomains/records/create', [SubdomainRecordController::class, 'create']);
Route::post('/subdomains/records', [SubdomainRecordController::class, 'store']);
Route::get('/subdomains/records/{record:id}', [SubdomainRecordController::class, 'show']);
Route::patch('/subdomains/records/{record:id}', [SubdomainRecordController::class, 'update']);
Route::delete('/subdomains/records/{record:id}', [SubdomainRecordController::class, 'destroy']);

Route::get('/mounts', [MountController::class, 'index']);
Route::post('/mounts', [MountController::class, 'store']);
Route::get('/mounts/{mount:id}', [MountController::class, 'show']);
Route::patch('/mounts/{mount:id}', [MountController::class, 'update']);
Route::delete('/mounts/{mount:id}', [MountController::class, 'destroy']);
Route::post('/mounts/{mount:id}/eggs', [MountController::class, 'attachEggs']);
Route::post('/mounts/{mount:id}/nodes', [MountController::class, 'attachNodes']);
Route::delete('/mounts/{mount:id}/eggs/{eggId}', [MountController::class, 'detachEgg']);
Route::delete('/mounts/{mount:id}/nodes/{nodeId}', [MountController::class, 'detachNode']);

Route::get('/nests', [NestController::class, 'index']);
Route::post('/nests', [NestController::class, 'store']);

Route::get('/nests/eggs/create', [EggController::class, 'create']);
Route::post('/nests/eggs', [EggController::class, 'store']);
Route::post('/nests/eggs/import', [EggController::class, 'import']);
Route::get('/nests/eggs/{egg:id}', [EggController::class, 'show']);
Route::patch('/nests/eggs/{egg:id}', [EggController::class, 'update']);
Route::delete('/nests/eggs/{egg:id}', [EggController::class, 'destroy']);
Route::get('/nests/eggs/{egg:id}/export', [EggController::class, 'export']);
Route::post('/nests/eggs/{egg:id}/import', [EggController::class, 'importUpdate']);

Route::get('/nests/eggs/{egg:id}/variables', [EggVariableController::class, 'index']);
Route::post('/nests/eggs/{egg:id}/variables', [EggVariableController::class, 'store']);
Route::patch('/nests/eggs/{egg:id}/variables/{variable:id}', [EggVariableController::class, 'update']);
Route::delete('/nests/eggs/{egg:id}/variables/{variable:id}', [EggVariableController::class, 'destroy']);

Route::get('/nests/eggs/{egg:id}/scripts', [EggScriptController::class, 'show']);
Route::patch('/nests/eggs/{egg:id}/scripts', [EggScriptController::class, 'update']);

Route::get('/nests/{nest:id}', [NestController::class, 'show']);
Route::patch('/nests/{nest:id}', [NestController::class, 'update']);
Route::delete('/nests/{nest:id}', [NestController::class, 'destroy']);
