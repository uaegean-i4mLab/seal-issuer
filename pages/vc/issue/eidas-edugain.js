import React from "react";
import axios from "axios";
import {
  setSessionData,
  makeOnlyConnectionRequest,
  addSetToSelection,
  setStepperSteps,
  setEndpoint,
  setBaseUrl,
  setServerSessionId,
  completeDIDAuth,
  makeSealSession,
  makeSealSessionWithDIDConnecetionRequest,
  setSealSession,
  setEidasUriPort,
  setEidasRedirectUri,
  setEdugainUriPort,
  setEdugainRedirectUri,
} from "../../../store";
import Layout from "../../../components/Layout";
import { connect } from "react-redux";
import { Button, Row, Col, Card, Container } from "react-bootstrap";
import MyStepper from "../../../components/Stepper";
import HomeButton from "../../../components/HomeButton";
import IssueLinkedVCButtonJolo from "../../../components/IssueLinkedVCButtonJolo";
import PairOrCard from "../../../components/PairOrCard";
import ConnectMobile from "../../../components/ConnectMobile";
import isMobile from "../../../helpers/isMobile";

/*
  Secure flow:
  - check in session if DID is present. This is not only the DID of the user but the whole connection response
  - if it is not present:
    - first display DID connection request (QR etc.). The DID response endpoint should contain the session here
    - on response on the server, send a SSE to the front end, denoting that DID auth is completed and on the server there is the DID component
    - Display additional datasources
    - on VC issance request, do not display QR code etc, but send the credentials straigth to the users wallet

*/

class IssueIsErasmusAegean extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
    this.proceedWithEidasAuth = this.proceedWithEidasAuth.bind(this);
    this.proceedWithEdugainAuth = this.proceedWithEdugainAuth.bind(this);
    this.hasRequiredAttributes =
      props.sessionData !== null &&
      props.sessionData !== undefined &&
      props.sessionData.eidas !== undefined &&
      props.sessionData.edugain !== undefined;
    this.hasEidas =  props.sessionData !== null && props.sessionData.eidas !== undefined;
    this.hasEdugain =  props.sessionData !== null && props.sessionData.eidas !== undefined;
  }

  static async getInitialProps({ reduxStore, req }) {
    let userSessionData;
    let DIDOk;
    let sealSession;
    if (typeof window === "undefined") {
      userSessionData = req.session.userData;
      reduxStore.dispatch(setEndpoint(req.session.enpoint));
      let baseUrl = req.session.baseUrl ? `/${req.session.baseUrl}/` : "";
      reduxStore.dispatch(setBaseUrl(baseUrl));
      reduxStore.dispatch(setServerSessionId(req.session.id));
      DIDOk = req.session.DID;
      sealSession = req.session.sealSession;

      // console.log(
      //   `eidas-edugain.js:: in the server the seal session is:: ${req.session.sealSession}`
      // );
      // console.log(`eidas-edugain.js setting eidas: ${req.eidasUri} , ${req.eidasPort}`)
      // console.log(`eidas-edugain.js setting eidas: ${req.eidasRedirectUri} `)

      reduxStore.dispatch(setEidasUriPort(req.eidasUri, req.eidasPort));
      reduxStore.dispatch(setEidasRedirectUri(req.eidasRedirectUri));
      reduxStore.dispatch(setEdugainRedirectUri(req.edugainRedirectUri));
      reduxStore.dispatch(setEdugainUriPort(req.edugainUri, req.edugainPort));
    } else {
      if (reduxStore.getState().sessionData) {
        userSessionData = reduxStore.getState().sessionData;
        DIDOk = reduxStore.getState().DID;
        //if ther is sessionData then there should be a session as well
        sealSession = reduxStore.getState().sealSession;
      } else {
        console.log(`no server session data found`);
      }
    }

    //this way the userSessionData gets set in all settings
    if (userSessionData) {
      reduxStore.dispatch(setSessionData(userSessionData));
    }
    if (DIDOk) {
      reduxStore.dispatch(completeDIDAuth(sealSession));
    }
    if (sealSession) {
      reduxStore.dispatch(setSealSession(sealSession));
    }

    //returned value here is getting mered with the mapstatetoprops
    // mapstatetoprops overrides these values if they match
    return {
      sessionData: userSessionData,
      qrData: reduxStore.getState().qrData,
      vcSent: false,
      sealSession: reduxStore.getState().sealSession,
    };
  }

  componentDidMount() {
    if (this.props.sessionData && this.props.sessionData.eidas) {
      let toSelect = [this.props.sessionData.eidas];
      if(this.props.sessionData.edugain){
        toSelect.push(this.props.sessionData.edugain)
      }

      this.props.setEidasToSelection(toSelect);
    }

    if (!this.props.DID) {
      //if DID auth has not been completed
      // console.log(`${new Date()} DID not found`);
      if (!this.props.sealSession) {
        this.props.startSealSessionAndDidAuth(
          this.props.baseUrl,
          "eidas",
          isMobile()
        ); //and then makeConnectionRequest
      } else {
        // console.log("makeConnectionRequest")
        console.log(`isMobile ${isMobile()}`);
        this.props.makeConnectionRequest(
          this.props.sealSession,
          this.props.baseUrl,
          "eidas",
          isMobile()
        );
      }
    }
  }

  componentDidUpdate() {
    if (this.props.DID) {
      //if DID auth is completed

      if (this.props.sessionData) {
        if (this.props.sessionData.eidas) {
          // register the callbackUri to the SessionManager eduGAIN
          axios
            .get(
              `${this.props.baseUrl}/vc/make-edugain-callback-token?sessionId=${this.props.sealSession}`
            )
            .then((data) => {
              axios
                .post(`${this.props.baseUrl}seal/update-session`, {
                  sessionId: this.props.sealSession,
                  variableName: "ClientCallbackAddr",
                  variableValue: `${this.props.edugainRedirectUri}?msToken=${data.data.additionalData}`,
                })
                .then((data) => {
                  //the edugain ms expects an empty datastore object to exist in session
                  axios
                    .post(`${this.props.baseUrl}seal/update-session`, {
                      sessionId: this.props.sealSession,
                      variableName: "dataStore",
                      variableValue: JSON.stringify({}),
                    })
                    .then((data) => {
                      console.log("edugain.js:: session updated");
                    });
                });
            });
        }
      } else {
        //if no session data exists, that means that no user authentication has taken place, i.e. no eIDAS auth since that is the first
        axios
          .post(`${this.props.baseUrl}seal/update-session`, {
            sessionId: this.props.sealSession,
            variableName: "ClientCallbackAddr",
            variableValue: this.props.eidasRedirectUri,
          })
          .then((data) => {
            console.log(
              `eidas.js:: session updated with ${this.props.sealSession}, ClientCallbackAddr and ${this.props.eidasRedirectUri}`
            );
          });
      }
    }
  }

  proceedWithEidasAuth() {
    //make msToken
    console.log("proceed  with ");
    axios
      .get(
        `${this.props.baseUrl}/vc/make-eidas-token?sessionId=${this.props.sealSession}`
      )
      .then((data) => {
        window.location.href = `https://${this.props.eidasUri}:${this.props.eidasPort}/eidas-idp/is/query?msToken=${data.data.additionalData}`;
        return null;
      });
  }

  proceedWithEdugainAuth() {
    axios
      .get(
        `${this.props.baseUrl}/vc/make-edugain-token?sessionId=${this.props.sealSession}`
      )
      .then((data) => {
        let theUrl = this.props.edugainUri.indexOf("https") >= 0
          ? this.props.edugainUri
          : `https://${this.props.edugainUri}`;

          console.log("!!!!!")
          console.log(`${theUrl}:${this.props.edugainPort}/is/query?msToken=${data.data.additionalData}`)
          window.location.href = `${theUrl}:${this.props.edugainPort}/is/query?msToken=${data.data.additionalData}`;
        return null;
      });
  }

  render() {
    let stepNumber = !this.props.DID ? 0 : ( (this.hasEidas ? (this.hasEdugain?2:3) : 1));
    let stepperSteps = [
      { title: "Pair your wallet" },
      { title: 'Authenticate over "eIDAS-eID"' },
      { title: 'Authenticate over "eduGAIN"' },
      { title: "Request Issuance" },
    ];

    if(this.props.vcFailed){
      return (<Layout>
        <Row>
          <Col>
            <MyStepper steps={stepperSteps} activeNum={stepNumber} />
          </Col>
        </Row>
       <div>
         VC issuance link failure. Please authenticate as the same person on all data sources!
       </div>
      </Layout>)

    }


    if (this.props.qrData && isMobile() && !this.props.DID) {
      return (
        <Layout>
          <Row>
            <Col>
              <MyStepper steps={stepperSteps} activeNum={stepNumber} />
            </Col>
          </Row>
          <ConnectMobile
            baseUrl={this.props.baseUrl}
            qrData={this.props.qrData}
            DID={this.props.DID}
            uuid={this.props.uuid}
            serverSessionId={this.props.serverSessionId}
            sealSession={this.props.sealSession}
          />
        </Layout>
      );
    }

    let eIDASLoginButton =
      !this.props.sessionData || !this.props.sessionData.eidas ? (
        <Button onClick={this.proceedWithEidasAuth}>eIDAS</Button>
      ) : (
        <Button variant="primary" disabled>
          eIDAS
        </Button>
      );

    let edugainLoginButton =
      this.props.sessionData &&
      !this.hasRequiredAttributes &&
      this.props.sessionData.eidas ? (
        <Button onClick={this.proceedWithEdugainAuth}>eduGAIN</Button>
      ) : (
        <Button variant="primary" disabled>
          eduGAIN
        </Button>
      );

    let issueLinkVCBut = (
      <IssueLinkedVCButtonJolo
        hasRequiredAttributes={this.hasRequiredAttributes}
        baseUrl={this.props.baseUrl}
        userSelection={this.props.userSelection}
        uuid={this.props.sealSession}
        vcType={"SEAL-EIDAS-EDUGAIN"}
      />
    );

    let credentialCard = this.props.vcFailed ? (<div> <p>Linking Failed. The provided attribute sets do not match!</p> <p>Please, make sure you authenticated with the correct credentials on the data sources and try again. </p> </div>) : 
     (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
        <Card.Header>
          Issue a Credential linking your eIDAS-eID with your eduGAIN attributes
        </Card.Header>
        <Card.Body>
          <Card.Title>
            {this.hasRequiredAttributes
              ? "Credentials Issuance is ready!"
              : "Please authenticate to the required data sources"}
          </Card.Title>
          <Card.Text>
            Once you have authenticated through the required data sources, click
            the "Issue" button to generate and receive your VC .
          </Card.Text>
          <Container>
            <Row>
              <Col>{eIDASLoginButton}</Col>
              <Col>{edugainLoginButton}</Col>
              <Col>{issueLinkVCBut}</Col>
            </Row>
          </Container>
        </Card.Body>
        {/* <Card.Footer className="text-muted">2 days ago</Card.Footer> */}
      </Card>
    );

    let result = (
      <PairOrCard
        qrData={this.props.qrData}
        DID={this.props.DID}
        baseUrl={this.props.baseUrl}
        uuid={this.props.uuid}
        serverSessionId={this.props.serverSessionId}
        card={credentialCard}
        vcSent={this.props.vcSent}
        sealSession={this.props.sealSession}
        credQROffer={this.props.credQROffer}
      />
    );

    return (
      <Layout>
        <Row>
          <Col>
            <MyStepper steps={stepperSteps} activeNum={stepNumber} />
          </Col>
        </Row>
        {result}

        <Row>
          <HomeButton baseUrl={this.props.baseUrl} />
        </Row>
      </Layout>
    );
  }
}
function mapStateToProps(state) {
  return {
    isFetching: state.fetching,
    qrData: state.qrData,
    sessionData: state.sessionData,
    userSelection: state.userSelection, // the attributes selected by the user to be included in a VC,
    baseUrl: state.baseUrl,
    DID: state.DID,
    serverSessionId: state.serverSessionId,
    uuid: state.uuid,
    vcSent: state.vcSent,
    sealSession: state.sealSession,
    eidasUri: state.eidasUri,
    eidasPort: state.eidasPort,
    edugainPort: state.edugainPort,
    edugainUri: state.edugainUri,
    endpoint: state.endpoint,
    eidasRedirectUri: state.eidasRedirectUri,
    edugainRedirectUri: state.edugainRedirectUri,
    vcFailed: state.vcFailed,
    credQROffer: state.credQROffer,
    
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setEidasToSelection: (set) => {
      dispatch(addSetToSelection(set));
    },
    setSteps: (steps) => {
      dispatch(setStepperSteps(steps));
    },
    setEndPoint: (endpont) => {
      dispatch(setEndpoint(endpoint));
    },
    makeConnectionRequest: (sealSession, baseUrl, vcType, isMobile) => {
      dispatch(
        makeOnlyConnectionRequest(sealSession, baseUrl, vcType, isMobile)
      );
    },
    didAuthOK: (uuid) => {
      dispatch(completeDIDAuth(uuid));
    },
    startSealSession: (baseUrl) => {
      dispatch(makeSealSession(baseUrl));
    },
    startSealSessionAndDidAuth: (baseUrl, vcType, isMobile) => {
      dispatch(
        makeSealSessionWithDIDConnecetionRequest(baseUrl, vcType, isMobile)
      );
    },
    setTheSealSession: (sessionId) => {
      dispatch(setSealSession(sessionId));
    },
    setEidas: (uri, data) => {
      dispatch(setEidasUriPort(uri, data));
    },

    setEidasRedirect: (uri) => {
      dispatch(setEidasRedirectUri(uri));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(IssueIsErasmusAegean);
