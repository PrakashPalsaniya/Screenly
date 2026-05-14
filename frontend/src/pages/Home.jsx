import { useEffect } from "react";
import { useDispatch } from "react-redux";
import BannerSlider from "../components/shared/BannerSlider";
import Recommended from "../components/Recommended";

const Home = () => {

  return (
    <div className="bg-[#f6f3ee]">
      <BannerSlider />
      <Recommended />
    </div>
  );
};

export default Home;
