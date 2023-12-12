import "react-app-polyfill/stable";

import { createRoot } from "react-dom/client";
import invariant from "tiny-invariant";

import { AppWithProviders } from "./AppWithProviders";
import * as serviceWorker from "./serviceWorker";

const container = document.getElementById("root");
invariant(container);
const root = createRoot(container);
root.render(<AppWithProviders />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
