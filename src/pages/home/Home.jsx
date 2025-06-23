// client/src/pages/home/Home.jsx

import Stories from "../../components/stories/Stories";
import Posts from "../../components/posts/Posts";
import Share from "../../components/share/Share";
import "./home.scss";

// Accept onOpenComingSoonModal as a prop
const Home = ({ onOpenComingSoonModal }) => {
  return (
    <div className="home">
      <Stories />
      <Share />
      {/* Pass onOpenComingSoonModal to Posts */}
      <Posts onOpenComingSoonModal={onOpenComingSoonModal} />
    </div>
  );
};

export default Home;
