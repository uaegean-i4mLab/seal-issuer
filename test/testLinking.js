import { startSession, autoLinkRequest } from "../back-services/sealServices";
const chai = require("chai");
const expect = chai.expect;

describe("Test the linking of various datasets ", async () => {
  it("should complete with no error, with non utf8 chars", async function () {
    this.timeout(50000); // 10 second timeout only for this test
    let sid = await startSession();
    return autoLinkRequest(sid, null, null, 2).then((result) => {
      expect(result["SEAL-EDUGAIN-EIDAS"].metadata.lloa).to.equal("low");
    });
  });

  it.only("should complete with no error, WITH utf8 chars", async function () {
    this.timeout(50000); // 10 second timeout only for this test
    let sid = await startSession();
    let dsa = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
      type: "eIDAS",
      categories: [],
      issuerId: "Issuer",
      subjectId: "PersonIdentifier",
      loa: "low",
      issued: "2018-12-06T19:40:16Z",
      expiration: "2018-15-06T19:45:16Z",
      attributes: [
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
          friendlyName: "CurrentGivenName",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA"],
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName",
          friendlyName: "FamilyName",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier",
          friendlyName: "PersonIdentifier",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["eidas.gr/gr/ermis-58333947"],
        },
        {
          name: "http://eidas.europa.eu/attributes/naturalperson/DateOfBirth",
          friendlyName: "DateOfBirth",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["1980-01-01"],
        },
        {
          name: "Issuer",
          friendlyName: "Issuer",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["https://eidas.redsara.es/EidasNode/ServiceMetadata"],
        },
      ],
      properties: {},
    };

    let dsb = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c5281aa",
      type: "eduGAIN",
      categories: [],
      issuerId: "Issuer",
      subjectId: "schacPersonalUniqueCode",
      loa: "2",
      issued: "2018-12-06T19:40:16Z",
      expiration: "2018-15-06T19:45:16Z",
      attributes: [
        {
          name: "displayName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name: "schacHomeOrganization",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["rediris.es"],
        },
        {
          name: "givenName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA"],
        },
        {
          name: "surname",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name: "commonName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["Francisco Jose Arago Monzonis"],
        },
        {
          name: "schacPersonalUniqueCode",
          friendlyName: "schacPersonalUniqueCode",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: [
            "urn:mace:terena.org:schac:personalUniqueCode:es:rediris:sir:mbid:{md5}fde3899abda05086e6a675518ea6a3f1",
          ],
        },
        {
          name: "Issuer",
          friendlyName: "Issuer",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["https://idp.rediris.es/module.php/saml2/idp/metadata.xml"],
        },
      ],
      properties: {},
    };

    return autoLinkRequest(sid, dsa, dsb).then((result) => {
      expect(result["SEAL-EDUGAIN-EIDAS"].metadata.lloa).to.equal("low");
    });
  });

  it("should complete not link!!", async function () {
    this.timeout(50000); // 10 second timeout only for this test
    let sid = await startSession();
    let dsa = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
      type: "eIDAS",
      categories: [],
      issuerId: "Issuer",
      subjectId: "PersonIdentifier",
      loa: "low",
      issued: "2018-12-06T19:40:16Z",
      expiration: "2018-15-06T19:45:16Z",
      attributes: [
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
          friendlyName: "CurrentGivenName",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ2 CHRISTINA2"],
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName",
          friendlyName: "FamilyName",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΠΑΛΙΟΚΩΣΤΑ123 PALIOKOSTA"],
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier",
          friendlyName: "PersonIdentifier",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["eidas.gr/gr/ermis-58333947"],
        },
        {
          name: "http://eidas.europa.eu/attributes/naturalperson/DateOfBirth",
          friendlyName: "DateOfBirth",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["1980-01-01"],
        },
        {
          name: "Issuer",
          friendlyName: "Issuer",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["https://eidas.redsara.es/EidasNode/ServiceMetadata"],
        },
      ],
      properties: {},
    };

    let dsb = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c5281aa",
      type: "eduGAIN",
      categories: [],
      issuerId: "Issuer",
      subjectId: "schacPersonalUniqueCode",
      loa: "2",
      issued: "2018-12-06T19:40:16Z",
      expiration: "2018-15-06T19:45:16Z",
      attributes: [
        {
          name: "displayName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name: "schacHomeOrganization",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["rediris.es"],
        },
        {
          name: "givenName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA"],
        },
        {
          name: "surname",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name: "commonName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["Francisco Jose Arago Monzonis"],
        },
        {
          name: "schacPersonalUniqueCode",
          friendlyName: "schacPersonalUniqueCode",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: [
            "urn:mace:terena.org:schac:personalUniqueCode:es:rediris:sir:mbid:{md5}fde3899abda05086e6a675518ea6a3f1",
          ],
        },
        {
          name: "Issuer",
          friendlyName: "Issuer",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["https://idp.rediris.es/module.php/saml2/idp/metadata.xml"],
        },
      ],
      properties: {},
    };

    return autoLinkRequest(sid, dsa, dsb).then((result) => {
      console.log(result);
      expect(result["SEAL-EDUGAIN-EIDAS"].metadata.lloa).to.equal("low");
    });
  });

  it("should complete utf8 real data", async function () {
    this.timeout(50000); // 10 second timeout only for this test
    let sid = await startSession();
    let dsa = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
      type: "eIDAS",
      categories: null,
      issuerId: null,
      subjectId: null,
      loa: null,
      issued: "2018-12-06T19:40:16Z",
      expiration: null,
      attributes: [
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName",
          friendlyName: "FamilyName",
          encoding: "UTF-8",
          language: "N/A",
          mandatory: true,
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
          friendlyName: "GivenName",
          encoding: "UTF-8",
          language: "N/A",
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA"],
        },
        {
          name: "http://eidas.europa.eu/attributes/naturalperson/DateOfBirth",
          friendlyName: "DateOfBirth",
          encoding: "UTF-8",
          language: "N/A",
          mandatory: true,
          values: ["1980-01-01"],
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier",
          friendlyName: "PersonIdentifier",
          encoding: "UTF-8",
          language: "N/A",
          mandatory: true,
          values: ["GR/GR/ERMIS-58333947"],
        },
        {
          name: "http://eidas.europa.eu/LoA",
          friendlyName: "LevelOfAssurance",
          encoding: "UTF-8",
          language: "N/A",
          mandatory: true,
          values: ["low"],
        },
      ],
      properties: {},
    };

    let dsb = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c5281aa",
      type: "eduGAIN",
      categories: [],
      issuerId: "Issuer",
      subjectId: "schacPersonalUniqueCode",
      loa: null,
      issued: "2018-12-06T19:40:16Z",
      expiration: null,
      attributes: [
        {
          name: "displayName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name: "schacHomeOrganization",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["rediris.es"],
        },
        {
          name: "givenName",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA"],
        },
        {
          name: "surname",
          friendlyName: null,
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
        },
        {
          name: "schacPersonalUniqueCode",
          friendlyName: "schacPersonalUniqueCode",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: [
            "urn:mace:terena.org:schac:personalUniqueCode:es:rediris:sir:mbid:{md5}fde3899abda05086e6a675518ea6a3f1",
          ],
        },
        {
          name: "Issuer",
          friendlyName: "Issuer",
          encoding: "plain",
          language: null,
          mandatory: true,
          values: ["https://idp.rediris.es/module.php/saml2/idp/metadata.xml"],
        },
      ],
      properties: {},
    };

    return autoLinkRequest(sid, dsa, dsb)
      .then((result) => {
        console.log(result);
        // expect(result["primaryCode"]).to.equal("REJECTED");
      })
      .catch((err) => {
        console.log(err);
      });
  });

  it("should complete with real call data!!", async function () {
    this.timeout(50000); // 10 second timeout only for this test
    let sid = await startSession();
    let dsa = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
      type: "eIDAS",
      categories: [],
      issuerId: "Issuer",
      subjectId: "PersonIdentifier",
      loa: "4",
      issued: "2018-12-06T19:40:16Z",
      expiration: "2018-15-06T19:45:16Z",
      attributes: [
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName",
          friendlyName: "FamilyName",
          encoding: "UTF-8",
          language: "N/A",
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
          mandatory: true,
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
          friendlyName: "GivenName",
          encoding: "UTF-8",
          language: "N/A",
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA"],
          mandatory: true,
        },
        {
          name: "http://eidas.europa.eu/attributes/naturalperson/DateOfBirth",
          friendlyName: "DateOfBirth",
          encoding: "UTF-8",
          language: "N/A",
          values: ["1980-01-01"],
          mandatory: true,
        },
        {
          name:
            "http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier",
          friendlyName: "PersonIdentifier",
          encoding: "UTF-8",
          language: "N/A",
          values: ["GR/GR/ERMIS-58333947"],
          mandatory: true,
        },
        {
          name: "http://eidas.europa.eu/LoA",
          friendlyName: "LevelOfAssurance",
          encoding: "UTF-8",
          language: "N/A",
          values: ["null"],
          mandatory: true,
        },
      ],
      id: "eidas",
    };

    let dsb = {
      id: "6c0f70a8-f32b-4535-b5f6-0d596c5281aa",
        type: "eduGAIN",
        categories: [],
        issuerId: "Issuer",
        subjectId: "schacPersonalUniqueCode",
        loa: "2",
        issued: "2018-12-06T19:40:16Z",
        expiration: "2018-15-06T19:45:16Z",
        attributes: [
        {
          name: "issuerEntityId",
          friendlyName: "issuerEntityId",
          encoding: "null",
          language: "null",
          values: ["https://eid-proxy.aai-dev.grnet.gr/Saml2IDP/proxy.xml"],
          mandatory: true,
        },
        {
          name: "urn:oid:1.3.6.1.4.1.5923.1.1.1.10",
          friendlyName: "eduPersonTargetedID",
          encoding: "null",
          language: "null",
          values: ["null"],
          mandatory: true,
        },
        {
          name: "urn:oid:2.5.4.42",
          friendlyName: "givenName",
          encoding: "null",
          language: "null",
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA"],
          mandatory: true,
        },
        {
          name: "urn:oid:0.9.2342.19200300.100.1.3",
          friendlyName: "mail",
          encoding: "null",
          language: "null",
          values: ["seal-test0@example.com"],
          mandatory: true,
        },
        {
          name: "urn:oid:2.5.4.3",
          friendlyName: "cn",
          encoding: "null",
          language: "null",
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA ΧΡΙΣΤΙΝΑ CHRISTINA"],
          mandatory: true,
        },
        {
          name: "urn:oid:2.5.4.4",
          friendlyName: "sn",
          encoding: "null",
          language: "null",
          values: ["ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
          mandatory: true,
        },
        {
          name: "urn:oid:2.16.840.1.113730.3.1.241",
          friendlyName: "displayName",
          encoding: "null",
          language: "null",
          values: ["ΧΡΙΣΤΙΝΑ CHRISTINA ΠΑΛΙΟΚΩΣΤΑ PALIOKOSTA"],
          mandatory: true,
        },
        {
          name: "urn:oid:1.3.6.1.4.1.5923.1.1.1.6",
          friendlyName: "eduPersonPrincipalName",
          encoding: "null",
          language: "null",
          values: ["128052@gn-vho.grnet.gr"],
          mandatory: true,
        },
        {
          name: "urn:oid:1.3.6.1.4.1.5923.1.1.1.7",
          friendlyName: "eduPersonEntitlement",
          encoding: "null",
          language: "null",
          values: ["urn:mace:grnet.gr:seal:test"],
          mandatory: true,
        },
      ],
      id: "edugain",
    };

    return autoLinkRequest(sid, dsa, dsb).then((result) => {
      console.log(result);
    });
  });
});
