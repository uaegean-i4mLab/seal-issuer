import { buildDataStoreFromNewAPI } from "../helpers/DataStoreHelper";
const chai = require("chai");
const expect = chai.expect;

describe("Test new api datastore ", async () => {
 
    it("should parse the new datastpre", async function () {
    let response = {
      code: "OK",
      sessionData: null,
      additionalData:
        '[{"id":"eduPersonTargetedID***NotFound","type":"dataSet","data":"{\\"id\\":\\"cd12d673-7fdf-46a0-8e79-bec6f0f45e84\\",\\"type\\":\\"eduGAIN\\",\\"categories\\":null,\\"issuerId\\":\\"This is the user ID.\\",\\"subjectId\\":null,\\"loa\\":null,\\"issued\\":\\"Thu, 1 Oct 2020 08:24:16 GMT\\",\\"expiration\\":null,\\"attributes\\":[{\\"name\\":\\"urn:oid:1.3.6.1.4.1.5923.1.1.1.10\\",\\"friendlyName\\":\\"eduPersonTargetedID\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[null]},{\\"name\\":\\"urn:oid:2.5.4.42\\",\\"friendlyName\\":\\"givenName\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[\\"ΧΡΙΣΤΙΝΑ CHRISTINA\\"]},{\\"name\\":\\"urn:oid:0.9.2342.19200300.100.1.3\\",\\"friendlyName\\":\\"mail\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[\\"seal-test0@example.com\\"]},{\\"name\\":\\"urn:oid:2.5.4.3\\",\\"friendlyName\\":\\"cn\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[\\"ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA ΧΡΙΣΤΙΝΑ CHRISTINA\\"]},{\\"name\\":\\"urn:oid:2.5.4.4\\",\\"friendlyName\\":\\"sn\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[\\"ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA\\"]},{\\"name\\":\\"urn:oid:2.16.840.1.113730.3.1.241\\",\\"friendlyName\\":\\"displayName\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[\\"ΧΡΙΣΤΙΝΑ CHRISTINA ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA\\"]},{\\"name\\":\\"urn:oid:1.3.6.1.4.1.5923.1.1.1.6\\",\\"friendlyName\\":\\"eduPersonPrincipalName\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[\\"128052@gn-vho.grnet.gr\\"]},{\\"name\\":\\"urn:oid:1.3.6.1.4.1.5923.1.1.1.7\\",\\"friendlyName\\":\\"eduPersonEntitlement\\",\\"encoding\\":null,\\"language\\":null,\\"values\\":[\\"urn:mace:grnet.gr:seal:test\\"]}],\\"properties\\":null}"}]',
      error: null,
    };

    let parsed = buildDataStoreFromNewAPI(response);

    console.log(parsed);

    
  });
});
