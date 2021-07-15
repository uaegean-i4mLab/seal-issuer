import React from "react";
import {
  setSessionData,
  makeOnlyConnectionRequest,
  addSetToSelection,
  setStepperSteps,
  setEndpoint,
  setBaseUrl,
  setServerSessionId,
  completeDIDAuth
} from "../store";
import Layout from "../components/Layout";
import { connect } from "react-redux";
import { Button, Row, Col, Card, Container } from "react-bootstrap";
import MyStepper from "../components/Stepper";
import HomeButton from "../components/HomeButton";
import IssueVCButton from "../components/IssueVCButton";
import PairOrCard from "../components/PairOrCard";
/*
  Secure flow:
  - check in session if DID is present. This is not only the DID of the user but the whole connection response
  - if it is not present:
    - first display DID connection request (QR etc.). The DID response endpoint should contain the session here
    - on response on the server, send a SSE to the front end, denoting that DID auth is completed and on the server there is the DID component
    - Display additional datasources
    - on VC issance request, do not display QR code etc, but send the credentials straigth to the users wallet

*/

class IssueEidas extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
  }

  static async getInitialProps({ reduxStore, req }) {
    let userSessionData;
    if (typeof window === "undefined") {
      userSessionData = req.session.userData;
      reduxStore.dispatch(setEndpoint(req.session.enpoint));
      let baseUrl = req.session.baseUrl ? `/${req.session.baseUrl}/` : "";
      reduxStore.dispatch(setBaseUrl(baseUrl));
      reduxStore.dispatch(setServerSessionId(req.session.id));
      if (req.session.did) {
        reduxStore.dispatch(completeDIDAuth(req.query.uuid));
      }
    } else {
      if (reduxStore.getState().sessionData) {
        userSessionData = reduxStore.getState().sessionData;
      } else {
        console.log(`no server session data found`);
      }
    }
    if (userSessionData) {
      reduxStore.dispatch(setSessionData(userSessionData));
    }
    //returned value here is getting mered with the mapstatetoprops
    // mapstatetoprops overrides these values if they match
    return {
      sessionData: userSessionData,
      qrData: reduxStore.getState().qrData,
      vcSent: false
    };
  }

  componentDidMount() {
    if (this.props.sessionData && this.props.sessionData.eidas) {
      let toSelect = [this.props.sessionData.eidas];
      this.props.setEidasToSelection(toSelect);
    }

    if (!this.props.DID) {
      console.log(`issue-eidas-secure:: no DID auth found in redux store`);
      this.props.makeConnectionRequest();
    }
  }

  render() {
    const hasRequiredAttributes =
      this.props.sessionData !== null &&
      this.props.sessionData !== undefined &&
      this.props.sessionData.eidas !== undefined;

    let keycloakEidasPath = `${this.props.baseUrl}eidas/eidas-authenticate-secure?uuid=${this.props.uuid}`;
    // let result = <div>Generating Wallet Pairing Request...</div>;

    let eIDASLoginButton = !hasRequiredAttributes ? (
      <a className="btn btn-primary" href={keycloakEidasPath} role="button">
        eIDAS
      </a>
    ) : (
      <Button variant="primary" disabled>
        eIDAS
      </Button>
    );

    let issueVCBut = (
      <IssueVCButton
        hasRequiredAttributes={hasRequiredAttributes}
        // vcIssuanceEndpoint={"/issueVCSecure"}
        baseUrl={this.props.baseUrl}
        userSelection={this.props.userSelection}
        uuid={this.props.uuid}
        vcType={"SEAL-EIDAS"}
      />
    );

    let eidasCard = (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
        <Card.Header>Issue an eIDAS based Verifiable Credential</Card.Header>
        <Card.Body>
          <Card.Title>
            {hasRequiredAttributes
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
              <Col>{issueVCBut}</Col>
            </Row>
          </Container>
        </Card.Body>
        {/* <Card.Footer className="text-muted">2 days ago</Card.Footer> */}
      </Card>
    );
    let stepNumber = !this.props.DID ? 0 : hasRequiredAttributes ? 2 : 1;
    let stepperSteps = [
      { title: "Pair your wallet" },
      { title: 'Authenticate over "eIDAS-eID"' },
      { title: "Request Issuance" }
    ];

    let result = (
      <PairOrCard
        qrData={this.props.qrData}
        DID={this.props.DID}
        baseUrl={this.props.baseUrl}
        uuid={this.props.uuid}
        serverSessionId={this.props.serverSessionId}
        card={eidasCard}
        vcSent={this.props.vcSent}
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
    vcSent: state.vcSent
  };
}

const mapDispatchToProps = dispatch => {
  return {
    setEidasToSelection: set => {
      dispatch(addSetToSelection(set));
    },
    setSteps: steps => {
      dispatch(setStepperSteps(steps));
    },
    setEndPoint: endpont => {
      dispatch(setEndpoint(endpoint));
    },
    //makeOnlyConnectionRequest
    makeConnectionRequest: () => {
      dispatch(makeOnlyConnectionRequest());
    },
    didAuthOK: uuid => {
      dispatch(completeDIDAuth(uuid));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(IssueEidas);
