export function fetchRefreshToken(): string | null {
  const refreshToken =
    sessionStorage.getItem("stack.auth") || localStorage.getItem("stack.auth");
  return refreshToken ? JSON.parse(refreshToken) : null;
}

export function storeRefreshToken(
  refreshToken: string,
  rememberMe: boolean | null
): void {
  if (refreshToken) {
    if (
      (rememberMe === null && localStorage.getItem("stack.auth")) ||
      rememberMe
    ) {
      localStorage.setItem("stack.auth", JSON.stringify(refreshToken));
      sessionStorage.removeItem("stack.auth");
    } else {
      sessionStorage.setItem("stack.auth", JSON.stringify(refreshToken));
      localStorage.removeItem("stack.auth");
    }
  } else {
    localStorage.removeItem("stack.auth");
    sessionStorage.removeItem("stack.auth");
  }
}
