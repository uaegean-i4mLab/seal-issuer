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

class IssueIsErasmusAegean extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
    this.proceedWithEidasAuth = this.proceedWithEidasAuth.bind(this);
    // this.proceedWithEdugainAuth = this.proceedWithEdugainAuth.bind(this);
    this.proceedWithLocalLDAP = this.proceedWithLocalLDAP.bind(this);
    this.hasRequiredAttributes =
      props.sessionData !== null &&
      props.sessionData !== undefined &&
      (props.sessionData.eidas !== undefined ||
        props.sessionData.edugain !== undefined);
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
        `eidas.js:: in the server the seal session is:: ${req.session.sealSession}`
      );
      reduxStore.dispatch(setEidasUriPort(req.eidasUri, req.eidasPort));
      reduxStore.dispatch(setEidasRedirectUri(req.eidasRedirectUri));
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
      errorUser: req.session.error,
      qrData: reduxStore.getState().qrData,
      vcSent: false,
      sealSession: reduxStore.getState().sealSession,
    };
  }

  componentDidMount() {
    if (this.props.sessionData && this.props.sessionData.eidas) {
      let toSelect = [this.props.sessionData.eidas];
      this.props.setEidasToSelection(toSelect);
    }
    if (this.props.sessionData && this.props.sessionData.edugain) {
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
    // let updateUrl = this.props.baseUrl !== ""?`${this.props.baseUrl}seal/update-session`:`/seal/update-session`
    // console.log(updateUrl)
    let updateUrl =
      this.props.baseUrl !== ""
        ? `${this.props.baseUrl}seal/update-session`
        : `/seal/update-session`;
    // console.log("!!!!!!!!!!!!!!!!1");
    // console.log(updateUrl);
    axios
      .post(updateUrl, {
        sessionId: this.props.sealSession,
        variableName: "ClientCallbackAddr",
        variableValue: this.props.eidasRedirectUri,
      })
      .then((data) => {
        console.log(data);
        console.log(
          `isErasmusAegean.js:: session updated with ${this.props.eidasRedirectUri}`
        );
      });
  }

  componentDidUpdate() {}

  async proceedWithLocalLDAP() {
    let sessionFrag = this.props.sealSession
      ? `?session=${this.props.sealSession}`
      : "";
    window.location.href = this.props.baseUrl
      ? `${this.props.baseUrl}uaegean-seal-usability/authenticate${sessionFrag}`
      : `${this.props.baseUrl}/uaegean-seal-usability/authenticate${sessionFrag}`;
  }

  async proceedWithEidasAuth() {
    let sessionFrag = this.props.sealSession
      ? `?session=${this.props.sealSession}`
      : "";
    window.location.href = this.props.baseUrl
      ? `${this.props.baseUrl}eidas/erasmus/response${sessionFrag}`
      : `${this.props.baseUrl}/eidas/erasmus/response${sessionFrag}`;
  }

  render() {
    let stepNumber = this.props.vcSent
      ? 3
      : !this.props.DID
      ? 0
      : this.hasRequiredAttributes
      ? 2
      : 1;
    let stepperSteps = [
      { title: "Pair your wallet" },
      { title: 'Authenticate over "eIDAS eID,  or email"' },
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

    let eIDASLoginButton = !this.hasRequiredAttributes ? (
      <div>
        <div className="row">
          <div className="col text-center">
            <Button
              onClick={this.proceedWithEidasAuth}
              style={{ width: "12rem", marginBottom: "0.7rem" }}
            >
              eIDAS eID
            </Button>
          </div>

          {/* <div className="col text-center">
            <Button
              onClick={this.proceedWithEdugainAuth}
              style={{ width: "12rem", marginBottom: "0.7rem" }}
            >
              eduGAIN
            </Button>
          </div> */}
        </div>
        <div className="row">
          <div className="col text-center">
            <Button
              onClick={this.proceedWithLocalLDAP}
              style={{ width: "12rem", marginBottom: "0.7rem" }}
            >
              Login with your email
            </Button>
          </div>
        </div>
      </div>
    ) : (
      <Button variant="primary" disabled>
        Authenticate
      </Button>
    );

    let issueVCBut = (
      <IssueVCButton
        hasRequiredAttributes={this.hasRequiredAttributes}
        baseUrl={this.props.baseUrl}
        userSelection={this.props.userSelection}
        uuid={this.props.sealSession}
        vcType={"SEAL-isErasmusAegean"}
      />
    );

    let eidasCard = this.props.errorUser ? (
      <div>
        {" "}
        <p>
          Your are not registerd as a University of the Aegean Erasmus Student
        </p>{" "}
        <div>Reason: {this.props.errorUser}</div>
      </div>
    ) : (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
        <Card.Header>
          Issue a myIDs Card, proving your affiliation with UAegean
        </Card.Header>
        <Card.Body>
          <Card.Title>
            {this.hasRequiredAttributes
              ? "Credentials Issuance is ready!"
              : "Please authenticate to one of the following data sources"}
          </Card.Title>
          <Card.Text>
            Once you have authenticated through one of the required data sources
            (i.e. eIDAS eID or via e-mail), click the "Issue" button to generate
            and receive your identity card.
          </Card.Text>
          <Container>
            <Row>
              <Col>{eIDASLoginButton}</Col>
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
        card={eidasCard}
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
    eidasUri: state.eidasUri,
    eidasPort: state.eidasPort,
    endpoint: state.endpoint,
    eidasRedirectUri: state.eidasRedirectUri,
    credQROffer: state.credQROffer,
    edugainUri: state.edugainUri,
    edugainPort: state.edugainPort,
    edugainRedirectUri: state.edugainRedirectUri,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setEidasToSelection: (set) => {
      dispatch(addSetToSelection(set));
    },
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
    setEidas: (uri, data) => {
      dispatch(setEidasUriPort(uri, data));
    },

    setEidasRedirect: (uri) => {
      dispatch(setEidasRedirectUri(uri));
    },
    setEdugain: (uri, data) => {
      dispatch(setEdugainUriPort(uri, data));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(IssueIsErasmusAegean);
