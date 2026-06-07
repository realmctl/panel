<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server\Files;

use Carbon\CarbonImmutable;
use Illuminate\Http\Response;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Pterodactyl\Enum\JwtScope;
use Pterodactyl\Models\Permission;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class FileJwtScopeTest extends ClientApiIntegrationTestCase
{
    public function testUploadUrlJwtIsScopedToFileUpload(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_FILE_CREATE]);

        $response = $this->actingAs($user)->getJson("/api/client/servers/$server->uuid/files/upload")
            ->assertStatus(Response::HTTP_OK);

        $url = $response->json('attributes.url');
        $prefix = $server->node->getConnectionAddress() . '/upload/file?token=';
        $this->assertStringStartsWith($prefix, $url);

        $token = $this->parseNodeToken($server, substr($url, strlen($prefix)));

        $this->assertSame($server->uuid, $token->claims()->get('server_uuid'));
        $this->assertEquals(JwtScope::FileUpload->value, $token->claims()->get('scope'));
        $this->assertNotEquals(JwtScope::Websocket->value, $token->claims()->get('scope'));
    }

    public function testDownloadUrlJwtIsScopedToFileDownload(): void
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_FILE_READ]);

        $response = $this->actingAs($user)->getJson("/api/client/servers/$server->uuid/files/download?file=%2Fserver.properties")
            ->assertStatus(Response::HTTP_OK);

        $url = $response->json('attributes.url');
        $prefix = $server->node->getConnectionAddress() . '/download/file?token=';
        $this->assertStringStartsWith($prefix, $url);

        $token = $this->parseNodeToken($server, substr($url, strlen($prefix)));

        $this->assertSame($server->uuid, $token->claims()->get('server_uuid'));
        $this->assertSame('/server.properties', $token->claims()->get('file_path'));
        $this->assertEquals(JwtScope::FileDownload->value, $token->claims()->get('scope'));
        $this->assertNotEquals(JwtScope::FileUpload->value, $token->claims()->get('scope'));
    }

    private function parseNodeToken($server, string $jwt): \Lcobucci\JWT\UnencryptedToken
    {
        $config = Configuration::forSymmetricSigner(new Sha256(), $key = InMemory::plainText($server->node->getDecryptedKey()));
        $config = $config->withValidationConstraints(new SignedWith(new Sha256(), $key));

        $token = $config->parser()->parse($jwt);

        $this->assertTrue(
            $config->validator()->validate($token, ...$config->validationConstraints()),
            'Failed to validate that the JWT data returned was signed using the Node\'s secret key.'
        );

        return $token;
    }
}
