const assert = require('assert');
import {startSession, updateSessionData, autoLinkRequest} from "../back-services/sealServices"
const crypto = require("crypto");
const jsesc = require("jsesc");



describe('HttpSignatures Tests update ', async () => {
 it('should update with utf8 characters and return with no error', async () => {
        
    let dsa = {
        "id": "6c0f70a8-f32b-4535-b5f6-0d596c52813a",
        "type": "eIDAS",
        "categories": [],
        "issuerId": "Issuer",
        "subjectId": "PersonIdentifier",
        "loa": "4",
        "issued": "2018-12-06T19:40:16Z",
        "expiration": "2018-15-06T19:45:16Z",
        "attributes": [
          {
            "name": "http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName",
            "friendlyName": "CurrentGivenName",
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "FRANCISCO  α "
            ]
          },
          {
            "name": "http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName",
            "friendlyName": "FamilyName",
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "ARAGO MONZONIS"
            ]
          },
          {
            "name": "http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier",
            "friendlyName": "PersonIdentifier",
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "GR/ES/12345678A"
            ]
          },
          {
            "name": "http://eidas.europa.eu/attributes/naturalperson/DateOfBirth",
            "friendlyName": "DateOfBirth",
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "1984-07-24"
            ]
          },
          {
            "name": "Issuer",
            "friendlyName": "Issuer",
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "https://eidas.redsara.es/EidasNode/ServiceMetadata"
            ]
          }
        ],
        "properties": {
          "test": "test value"
        }
      }
    

      let dsb = {
        "id": "6c0f70a8-f32b-4535-b5f6-0d596c5281aa",
        "type": "eduGAIN",
        "categories": [],
        "issuerId": "Issuer",
        "subjectId": "schacPersonalUniqueCode",
        "loa": "2",
        "issued": "2018-12-06T19:40:16Z",
        "expiration": "2018-15-06T19:45:16Z",
        "attributes": [
          {
            "name": "displayName",
            "friendlyName": null,
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "Francisco Jose Arago Monzonis"
            ]
          },
          {
            "name": "schacHomeOrganization",
            "friendlyName": null,
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "rediris.es"
            ]
          },
          {
            "name": "givenName",
            "friendlyName": null,
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "Francisco Jose"
            ]
          },
          {
            "name": "surname",
            "friendlyName": null,
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "Arago Monzonis"
            ]
          },
          {
            "name": "commonName",
            "friendlyName": null,
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "Francisco Jose Arago Monzonis"
            ]
          },
          {
            "name": "schacPersonalUniqueCode",
            "friendlyName": "schacPersonalUniqueCode",
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "urn:mace:terena.org:schac:personalUniqueCode:es:rediris:sir:mbid:{md5}fde3899abda05086e6a675518ea6a3f1"
            ]
          },
          {
            "name": "Issuer",
            "friendlyName": "Issuer",
            "encoding": "plain",
            "language": null,
            "mandatory": true,
            "values": [
              "https://idp.rediris.es/module.php/saml2/idp/metadata.xml"
            ]
          }
        ],
        "properties": {}
    
      }

      let linkRequest = {
        "id": null,
        "issuer" : null,
        "lloa" : null,
        "type" : null,
        "issued" : null,
        "expiration" : null,
        "evidence" : null,
        "conversation" : null,
        "datasetA" : dsa,
        "datasetB" : dsb
      } 

    let sessionId = await startSession();
    let response = await updateSessionData(sessionId, "linkRequest",  jsesc(linkRequest, {
      json: true,
    }))
    // console.log(response)
        assert.equal(response, "OK");
    });


    it('should pring the message digest', () =>{
        let str = `{"sessionId":"a4da0ac6-41f8-4d13-ae3d-7ff5ac85e747","variableName":"linkRequest","dataObject":"{\"id\":null,\"issuer\":null,\"lloa\":null,\"type\":null,\"issued\":null,\"expiration\":null,\"evidence\":null,\"conversation\":null,\"datasetA\":{\"id\":\"6c0f70a8-f32b-4535-b5f6-0d596c52813a\",\"type\":\"eIDAS\",\"categories\":[],\"issuerId\":\"Issuer\",\"subjectId\":\"PersonIdentifier\",\"loa\":\"4\",\"issued\":\"2018-12-06T19:40:16Z\",\"expiration\":\"2018-15-06T19:45:16Z\",\"attributes\":[{\"name\":\"http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName\",\"friendlyName\":\"CurrentGivenName\",\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"FRANCISCO  ασ\"]},{\"name\":\"http://eidas.europa.eu/attributes/naturalperson/CurrentFamilyName\",\"friendlyName\":\"FamilyName\",\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"ARAGO MONZONIS\"]},{\"name\":\"http://eidas.europa.eu/attributes/naturalperson/PersonIdentifier\",\"friendlyName\":\"PersonIdentifier\",\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"GR/ES/12345678A\"]},{\"name\":\"http://eidas.europa.eu/attributes/naturalperson/DateOfBirth\",\"friendlyName\":\"DateOfBirth\",\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"1984-07-24\"]},{\"name\":\"Issuer\",\"friendlyName\":\"Issuer\",\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"https://eidas.redsara.es/EidasNode/ServiceMetadata\"]}],\"properties\":{\"test\":\"test value\"}},\"datasetB\":{\"id\":\"6c0f70a8-f32b-4535-b5f6-0d596c5281aa\",\"type\":\"eduGAIN\",\"categories\":[],\"issuerId\":\"Issuer\",\"subjectId\":\"schacPersonalUniqueCode\",\"loa\":\"2\",\"issued\":\"2018-12-06T19:40:16Z\",\"expiration\":\"2018-15-06T19:45:16Z\",\"attributes\":[{\"name\":\"displayName\",\"friendlyName\":null,\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"Francisco Jose Arago Monzonis\"]},{\"name\":\"schacHomeOrganization\",\"friendlyName\":null,\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"rediris.es\"]},{\"name\":\"givenName\",\"friendlyName\":null,\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"Francisco Jose\"]},{\"name\":\"surname\",\"friendlyName\":null,\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"Arago Monzonis\"]},{\"name\":\"commonName\",\"friendlyName\":null,\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"Francisco Jose Arago Monzonis\"]},{\"name\":\"schacPersonalUniqueCode\",\"friendlyName\":\"schacPersonalUniqueCode\",\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"urn:mace:terena.org:schac:personalUniqueCode:es:rediris:sir:mbid:{md5}fde3899abda05086e6a675518ea6a3f1\"]},{\"name\":\"Issuer\",\"friendlyName\":\"Issuer\",\"encoding\":\"plain\",\"language\":null,\"mandatory\":true,\"values\":[\"https://idp.rediris.es/module.php/saml2/idp/metadata.xml\"]}],\"properties\":{}}}`
        console.log(crypto
            .createHash("sha256")
            // .update(postParamString, 'utf8').digest("base64")
            .update(str,'utf-8')
            .digest("base64"))


    })




});