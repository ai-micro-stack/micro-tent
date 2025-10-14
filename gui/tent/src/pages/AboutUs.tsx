import Image from "react-bootstrap/Image";
import { Container, Row, Col } from "react-bootstrap";

function AboutUs() {
  const items = [
    {
      icon: "micro-rack.png",
      title: "Micro Tent",
      text: "A hyperconverged infrastructure (HCI) setup & managing application. Using the popular converged storage software like CephFS or GlusterFS, it is able to create any number of independent convergence clusters. Combining with the Micro-Rack, another app in this Micro-Stack series, it is able to setup an AI research & developent enviroment easily.",
    },
    {
      icon: "free-use.png",
      title: "Free Use",
      text: "Completely free use for any commericals, non profit organizations and individual researchers. Will charge some time cost for technical supports. No registration requirement to suers, authos even don't know who is using their software, but a feedback is valuable for authers to improve the software.",
    },
    {
      icon: "open-source.png",
      title: "Open Source",
      text: "Complely Open source. Users can build the whole thing from the source code to have the private version of the solftware that belongs to themselves. Make a github star or write a review post on any tech site are also valuable helps to let more people know it. If you clone the souce code for your development, it is apprecated to give the credit to original authors, but not a requirement.",
    },
    {
      icon: "user-plugin.png",
      title: "User Plugin",
      text: "The software takes open architecture. All features are implemented in modules and plugins. Users can develop their plugins by customizing the template presented in the source code to support the specical OS boot requirements. All frontend code is wroten in TypeScript, and backend code are writen in JavaScript combing Linux shell script.",
    },
    {
      icon: "contributors.png",
      title: "Contributing",
      text: "Welcome the contributors to join the project to improve the software quality and expand the new features. Programming skills in TypeScript is the reqirement, as the code builder needs to pass the code integritiy check to start. Progamming in cansual code style would not pass the check.",
    },
    {
      icon: "sponsorship.png",
      title: "Sponsorship",
      text: "The software is developed and maintained by volunteer contributors, and resources used in project is paid from themselve's pockets. Looking forward to the finacial supportings or adoption to keep this project and the consequences running. Thank you for your time and attention to read it down to here!",
    },
  ];
  const cstyle = {
    paddingLeft: "60px",
    paddingRight: "60px",
    marginRottom: "30px",
    paddingBottom: "30px",
    paddingTop: "30px",
  };
  const istyle = {
    marginTop: "1em",
    backgroundColor: "#eee",
    border: "true",
  };
  const rstyle = { marginTop: "1em" };
  return (
    <div style={cstyle}>
      <h3 className="text-center">
        <b>About</b>
      </h3>
      <Container className="m-t-5" style={rstyle}>
        <Row>
          <Col
            className="col-sm-2 d-flex flex-wrap align-items-center"
            style={istyle}
          >
            <Image src="about.png" fluid />
          </Col>
          <Col>
            <Container fluid>
              {items.map((item) => (
                <Row style={rstyle} key={item.title}>
                  <Col className="col-sm-1">
                    <Image
                      // className="img-thumbnail"
                      src={`${item.icon}`}
                      fluid
                    />
                  </Col>
                  <Col>
                    <h5>
                      <b>{item.title}</b>
                    </h5>
                    <p>{item.text}</p>
                  </Col>
                </Row>
              ))}
            </Container>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
export default AboutUs;
