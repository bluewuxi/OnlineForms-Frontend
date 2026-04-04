import { Link } from 'react-router-dom'

export function PublicFooter() {
  return (
    <footer className="public-site-footer">
      <div className="public-site-footer__inner">
        <div className="public-site-footer__cols">
          <div className="public-site-footer__col">
            <p className="public-site-footer__heading">Explore</p>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/">Courses</Link></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Blog</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Events</a></li>
            </ul>
          </div>
          <div className="public-site-footer__col">
            <p className="public-site-footer__heading">Company</p>
            <ul>
              <li><a href="#" onClick={(e) => e.preventDefault()}>About Us</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Contact</a></li>
            </ul>
          </div>
          <div className="public-site-footer__col">
            <p className="public-site-footer__heading">Account</p>
            <ul>
              <li><Link to="/org/login">Login</Link></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Training</a></li>
            </ul>
          </div>
        </div>
        <p className="public-site-footer__copy">
          © {new Date().getFullYear()} OnlineForms. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
