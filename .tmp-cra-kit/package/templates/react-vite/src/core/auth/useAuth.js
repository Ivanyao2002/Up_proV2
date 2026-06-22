import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectAccessToken,
  selectRefreshToken,
  selectIsAuthenticated,
} from "./authSelectors";

export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);
  const refreshToken = useSelector(selectRefreshToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
  };
};
