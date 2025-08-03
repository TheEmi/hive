const Toast = (props, context) => {
  const { getState, setState, subscribe } = context;

  // Initialize toast state
  if (!getState("toastInitialized", false)) {
    setState("toastMessage", "");
    setState("toastVisible", false);
    setState("toastTimeout", null);
    setState("toastInitialized", true);
  }

  // Function to show toast
  const showToast = (message, duration = 3000) => {
    // Clear any existing timeout
    const existingTimeout = getState("toastTimeout", null);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    setState("toastMessage", message);
    setState("toastVisible", true);

    // Auto-hide after duration
    const timeout = setTimeout(() => {
      setState("toastVisible", false);
      setState("toastTimeout", null);
    }, duration);

    setState("toastTimeout", timeout);
  };

  // Make showToast available globally
  setState("showToast", showToast);

  const hideToast = () => {
    setState("toastVisible", false);
    const timeout = getState("toastTimeout", null);
    if (timeout) {
      clearTimeout(timeout);
      setState("toastTimeout", null);
    }
  };

  return {
    render: () => {
      const message = getState("toastMessage", "");

     // if (!isVisible) return null;

      return {
        div: {
          className: () => `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
            getState("toastVisible", false) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`,
          children: [
            {
              div: {
                className: "bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg max-w-sm mx-auto",
                children: [
                  {
                    div: {
                      className: "flex items-center justify-between",
                      children: [
                        {
                          span: {
                            className: "text-sm font-medium",
                            text: () => getState("toastMessage", "")
                          }
                        },
                        {
                          button: {
                            className: "ml-4 text-white hover:text-gray-200 transition-colors",
                            onclick: hideToast,
                            children: [
                              {
                                svg: {
                                  className: "w-4 h-4",
                                  fill: "none",
                                  stroke: "currentColor",
                                  viewBox: "0 0 24 24",
                                  children: [
                                    {
                                      path: {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: "2",
                                        d: "M6 18L18 6M6 6l12 12"
                                      }
                                    }
                                  ]
                                }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          ]
        }
      };
    }
  };
};

export default Toast;
