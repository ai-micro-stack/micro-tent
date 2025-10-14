import Spinner from "react-bootstrap/Spinner";

function Loading() {
  return (
	<div className="text-center position-absolute top-50 start-50 translate-middle">
	  <Spinner animation="border" role="status">
		<span className="visually-hidden">Loading...</span>
	  </Spinner>
	</div>
  );
}

export default Loading;
