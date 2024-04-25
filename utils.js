const debounce = (func, delay) => {
  let timerID;
  return (...args) => {
    clearTimeout(timerID);
    timerID = setTimeout(() => func(...args), delay);
  };
};

export default debounce;
