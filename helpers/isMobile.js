import MobileDetect from "mobile-detect";

const Named =  () => {
  if (typeof  window != 'undefined') {
    const md = new MobileDetect(window.navigator.userAgent);
    return Boolean(md.mobile() || md.phone());
  }
  return false;
};

export default Named;
