'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {isOfficialAgentUrl,externalBrowserUrl}=require('../url-policy.cjs');
test('online PC opens only the official SD Lotze agent route',()=>{
 for(const p of ['https://www.thesdhub.com/agent/index.html','https://thesdhub.com/agent/','https://www.thesdhub.com/agent/zugang.json'])
  assert.equal(isOfficialAgentUrl(p),true,p);
 for(const p of ['http://www.thesdhub.com/agent/index.html','https://evil.example/agent/index.html',
  'https://www.thesdhub.com.evil.example/agent/index.html','https://www.thesdhub.com/studio/',
  'javascript:alert(1)','file:///etc/passwd','https://user:pass@www.thesdhub.com/agent/index.html'])
  assert.equal(isOfficialAgentUrl(p),false,p);
});
test('external URLs cannot invoke dangerous desktop protocols',()=>{
 assert.equal(externalBrowserUrl('https://example.com/'), 'https://example.com/');
 assert.equal(externalBrowserUrl('mailto:kontakt@thesdhub.com'),'mailto:kontakt@thesdhub.com');
 assert.equal(externalBrowserUrl('file:///etc/passwd'),null);
 assert.equal(externalBrowserUrl('javascript:alert(1)'),null);
 assert.equal(externalBrowserUrl('app://evil'),null);
});
