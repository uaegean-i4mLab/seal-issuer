import Link from "next/link";
import { Container, Row, Navbar } from "react-bootstrap";

const linkStyle = {
  marginRight: 15,
};

const Header = (props) => (
  <Container fluid>
    {/* <Navbar expand="sm" bg="dark" variant="dark" >
      <Navbar.Brand href="/">
        <img
          alt=""
          src={props.baseUrl?`${props.baseUrl}seal-logo.png`:"/seal-logo.png"}  
          width="100"
          height="40"
          className="d-inline-block align-top"
        />{" "}
       
      </Navbar.Brand>
    </Navbar> */}

    <Navbar  bg="light" expand="lg">
      <div className="navbar-header">
        <Navbar.Brand className="navbar-brand" href="https://project-seal.eu/about">
          <span>
            {/* <img
              src="https://seal.uma.es/static/images/logo_seal_superpeque%C3%B1o.png"
              alt="SEAL DASHBOARD"
            /> */}
          </span>
          Verifiable Credential Issuer
        </Navbar.Brand >
      </div>
    </Navbar>
  </Container>
);

export default Header;
