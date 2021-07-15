import { Button } from "react-bootstrap";
import React from "react";
import { connect } from "react-redux";
import { makeAndPushVCJolo } from "../store";
import isMobile from "../helpers/isMobile";

class IssueLinkedVCButtonJolo extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.session = props.session;
    this.hasRequiredAttributes = props.hasRequiredAttributes;
    this.vcIssuanceEndpoint = props.vcIssuanceEndpoint;
    this.vcType= props.vcType
    this.click = this.click.bind(this);
  }

  componentDidMount() {}

  click() {
    const vcType = this.props.vcType;
    console.log("issueLinkedVCButtonJolo:: click called with session id " + this.props.uuid)
    let url = this.props.baseUrl
      ? `${this.props.baseUrl}seal/issueVCJolo`
      : `/seal/issueVCJolo`;
    console.log(
      `will send request for ${url} type ${vcType} isMobile ${isMobile()}`
    );
    this.props.sendVC(`${url}`, this.props.userSelection, vcType, this.props.uuid, isMobile());
  }

  render() {
    return (
      <Button
        variant="primary"
        disabled={!this.props.hasRequiredAttributes}
        onClick={this.click}
      >
        Issue
      </Button>
      // </Link>
    );
  }
}

function mapStateToProps(state) {
  return {
    status: state.sessionStatus
  };
}

const mapDispatchToProps = dispatch => {
  return {
    sendVC: (url, userSelection, vcType, uuid, isMobile) => {
      console.log("issueVCButtonJOLO.js user mapDispatchToProps")
      // console.log(userSelection)
      dispatch(makeAndPushVCJolo(url, userSelection, vcType, uuid, isMobile));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(IssueLinkedVCButtonJolo);
