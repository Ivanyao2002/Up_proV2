import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { authReducer } from "../auth/authSlice";
import { apiSlice } from "../api/apiSlice";
import storage from "redux-persist/es/storage";
import { persistReducer, persistStore } from "redux-persist";
import { reduxQueryErrorMiddleware } from "../redux/reduxQueryErrorMiddleware";

const persistConfig = {
  key: "root",
  storage: storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      apiSlice.middleware,
      reduxQueryErrorMiddleware,
    ),
});

const persistor = persistStore(store);
export { store, persistor };
