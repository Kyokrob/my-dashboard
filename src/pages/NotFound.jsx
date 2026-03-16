import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import Button from "@mui/material/Button";
import "./NotFound.scss";

export default function NotFound() {
  return (
    <DashboardLayout title="Page Not Found">
      <div className="notfound">
        <div className="notfound__card">
          <div className="notfound__code">404</div>
          <div className="notfound__title">We can’t find that page.</div>
          <div className="notfound__sub">
            The link may be broken or the page may have moved.
          </div>
          <Button component={Link} to="/" variant="contained">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
