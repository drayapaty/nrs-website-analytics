import { Amplify, Auth } from "aws-amplify";

Amplify.configure({
  Auth: {
    region: "eu-central-1",
    userPoolId: "eu-central-1_LJiTGPicM",
    userPoolWebClientId: "2pggi2h07uhf4skekoscm9l7fr",
    mandatorySignIn: true,
    authenticationFlowType: "USER_SRP_AUTH",
  },
});

/* ── helpers matching hhns-admin-new/src/services/awsAmplify.js ── */

export function signIn(email: string, password: string) {
  return Auth.signIn(email, password);
}

export function completeNewPassword(user: any, newPassword: string) {
  return Auth.completeNewPassword(user, newPassword);
}

export function getCurrentUser() {
  return Auth.currentAuthenticatedUser({ bypassCache: true });
}

export function checkUser() {
  return Auth.currentAuthenticatedUser();
}

export function signOut() {
  return Auth.signOut();
}

export function forgotPassword(email: string) {
  return Auth.forgotPassword(email);
}

export function resetPasswordWithCode(
  username: string,
  code: string,
  newPassword: string
) {
  return Auth.forgotPasswordSubmit(username, code, newPassword);
}

export function setupTOTP(user: any) {
  return Auth.setupTOTP(user);
}

export function verifyTotpToken(user: any, code: string) {
  return Auth.verifyTotpToken(user, code);
}

export function setPreferredMFA(user: any, mfaType: string) {
  return Auth.setPreferredMFA(user, mfaType as any);
}

export function confirmSignIn(user: any, mfaCode: string) {
  return Auth.confirmSignIn(user, mfaCode, user.challengeName);
}

export function getToken(): Promise<string | null> {
  return Auth.currentAuthenticatedUser({ bypassCache: true })
    .then((data: any) => {
      const { signInUserSession } = data;
      return signInUserSession?.idToken?.jwtToken || null;
    })
    .catch(() => null);
}
