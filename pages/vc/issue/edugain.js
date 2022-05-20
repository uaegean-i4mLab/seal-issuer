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
  setEdugainUriPort,
  setEdugainRedirectUri,
} from "../../../store";
import Layout from "../../../components/Layout";
import { connect } from "react-redux";
import { Button, Row, Col, Card, Container } from "react-bootstrap";
import MyStepper from "../../../components/Stepper";
import IssueVCButton from "../../../components/IssueVCButton";
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

class IssueEdugain extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
    this.proceedWithAuthentication = this.proceedWithAuthentication.bind(this);
    this.hasRequiredAttributes =
      props.sessionData !== null &&
      props.sessionData !== undefined &&
      props.sessionData.edugain !== undefined;
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

      console.log(
        `edugainjs:: in the server the seal session is:: ${req.session.sealSession}`
      );
      reduxStore.dispatch(setEdugainUriPort(req.edugainUri, req.edugainPort));
      reduxStore.dispatch(setEdugainRedirectUri(req.edugainRedirectUri));
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
      console.log("edugain.js:: will setSessionData")
      console.log(userSessionData)
      reduxStore.dispatch(setSessionData(userSessionData));
    }
    if (DIDOk) {
      console.log("edugain.js:: will set completeDIDAuth")
      reduxStore.dispatch(completeDIDAuth(sealSession));
    }
    if (sealSession) {
      console.log("edugain.js:: will set sealSession")
      console.log(sealSession)
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
    console.log("edugain.js:: componentDIDMount")
    if (this.props.sessionData && this.props.sessionData.edugain) {
      console.log(`edugain.js :: the data is ${this.props.sessionData.edugain}`)
      let toSelect = [this.props.sessionData.edugain];
      this.props.setEdugainToSelection(toSelect);
    }

    if (!this.props.DID) {
      //if DID auth has not been completed
      // console.log(`${new Date()} DID not found`);
      if (!this.props.sealSession) {
        // console.log("startSealSessionAndDidAuth")
        console.log(`isMobile ${isMobile()}`);

        this.props.startSealSessionAndDidAuth(
          this.props.baseUrl,
          "edugain",
          isMobile()
        ); //and then makeConnectionRequest
      } else {
        // console.log("makeConnectionRequest")
        console.log(`isMobile ${isMobile()}`);
        this.props.makeConnectionRequest(
          this.props.sealSession,
          this.props.baseUrl,
          "edugain",
          isMobile()
        );
      }
    }

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

  componentDidUpdate() {
    console.log(`edugain.js:: componentDidUpdate ${this.hasRequiredAttributes}`)


    if (this.props.DID & !this.hasRequiredAttributes) {
      //if DID auth is completed
      // register the callbackUri to the SessionManager
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
  }

  proceedWithAuthentication() {
    axios
      .get(
        `${this.props.baseUrl}/vc/make-edugain-token?sessionId=${this.props.sealSession}`
      )
      .then((data) => {
        console.log("***********")
        console.log(this.props.edugainUri)
        console.log(this.props.edugainUri.indexOf("https") >= 0)
        let theUrl = this.props.edugainUri.indexOf("https") >= 0
          ? this.props.edugainUri
          : `https://${this.props.edugainUri}`;

          console.log("!!!!!")
          console.log(theUrl)
          console.log("!!!!!")

          console.log(`${theUrl}:${this.props.edugainPort}/is/query?msToken=${data.data.additionalData}`)
          window.location.href = `${theUrl}:${this.props.edugainPort}/is/query?msToken=${data.data.additionalData}`;
      });
  }

  render() {
    let stepNumber = !this.props.DID ? 0 : this.hasRequiredAttributes ? 2 : 1;
    let stepperSteps = [
      { title: "Pair your wallet" },
      { title: 'Authenticate over "eduGAIN"' },
      { title: "Request Issuance" },
    ];

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

    let edugainLoginButton = !this.hasRequiredAttributes ? (
      <Button onClick={this.proceedWithAuthentication}>eduGAIN</Button>
    ) : (
        <Button variant="primary" disabled>
          eduGAIN
        </Button>
      );

    let issueVCBut = (
      <IssueVCButton
        hasRequiredAttributes={this.hasRequiredAttributes}
        // vcIssuanceEndpoint={"/issueVCSecure"}
        baseUrl={this.props.baseUrl}
        userSelection={this.props.userSelection}
        uuid={this.props.sealSession}
        vcType={"SEAL-EDUGAIN"}
      />
    );

    let edugainCard = (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
        <Card.Header>Issue an EDUGAIN based Verifiable Credential</Card.Header>
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
              <Col>{edugainLoginButton}</Col>
              <Col>{issueVCBut}</Col>
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
        card={edugainCard}
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

        {/* <Row>
          <HomeButton baseUrl={this.props.baseUrl} />
        </Row> */}
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
    edugainUri: state.edugainUri,
    edugainPort: state.edugainPort,
    endpoint: state.endpoint,
    edugainRedirectUri: state.edugainRedirectUri,
    credQROffer: state.credQROffer,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setEdugainToSelection: (set) => {
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
    setEdugain: (uri, data) => {
      dispatch(setEdugainUriPort(uri, data));
    },

    setEdugainRedirect: (uri) => {
      dispatch(setEdugainRedirectUri(uri));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(IssueEdugain);
