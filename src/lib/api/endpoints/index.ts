/**
 * The API surface the rest of the console imports, and the one place that
 * decides where it is answered from.
 *
 * Two complete implementations exist, with identical signatures: the in-browser
 * mock database in the sibling modules, and the real FastAPI service in
 * `./http`. This module picks one. Nothing under `features/` knows which, which
 * is what has let the backend be built without touching a single screen.
 *
 * The `typeof httpApi` annotation on `mockApi` is doing real work: it makes the
 * compiler check that every mock function still matches the shape of its HTTP
 * counterpart. If a route's response changes and the mock is not updated to
 * match, that is a build failure here rather than a surprise when the flag is
 * flipped.
 */
import { USE_MOCKS } from "./_shared";
import * as accountsMock from "./accounts";
import * as connectorsMock from "./connectors";
import * as httpApi from "./http";
import * as ingestionMock from "./ingestion";
import * as messagesMock from "./messages";
import * as notesMock from "./notes";
import * as orgMock from "./org";
import * as peopleMock from "./people";
import * as summaryMock from "./summary";
import * as systemMock from "./system";

export { ApiError } from "../http";
export * from "./_shared";
export type { CreateAccountInput, UnlinkedAccount } from "./accounts";
export type { TriggerRunOptions } from "./ingestion";
export type { CreateOrgNodeInput, UpdateOrgNodePatch } from "./org";
export type { CreatePersonInput, ForgetUserResult } from "./people";

const mockApi: typeof httpApi = {
  ...accountsMock,
  ...connectorsMock,
  ...ingestionMock,
  ...messagesMock,
  ...notesMock,
  ...orgMock,
  ...peopleMock,
  ...summaryMock,
  ...systemMock,
};

const api: typeof httpApi = USE_MOCKS ? mockApi : httpApi;

// -- people ----------------------------------------------------------------
export const getUsers = api.getUsers;
export const getUsersPage = api.getUsersPage;
export const getUser = api.getUser;
export const getUserAccounts = api.getUserAccounts;
export const getUserMessages = api.getUserMessages;
export const updateUser = api.updateUser;
export const createUser = api.createUser;
export const forgetUser = api.forgetUser;

// -- notes -----------------------------------------------------------------
export const getUserNotes = api.getUserNotes;
export const createUserNote = api.createUserNote;
export const deleteUserNote = api.deleteUserNote;

// -- accounts --------------------------------------------------------------
export const getUnlinkedAccounts = api.getUnlinkedAccounts;
export const linkAccount = api.linkAccount;
export const unlinkAccount = api.unlinkAccount;
export const deleteAccount = api.deleteAccount;
export const createAccount = api.createAccount;

// -- messages and summaries ------------------------------------------------
export const getMessages = api.getMessages;
export const getUserSummary = api.getUserSummary;
export const regenerateUserSummary = api.regenerateUserSummary;

// -- organization ----------------------------------------------------------
export const getOrgNodes = api.getOrgNodes;
export const createOrgNode = api.createOrgNode;
export const updateOrgNode = api.updateOrgNode;
export const deleteOrgNode = api.deleteOrgNode;
export const assignOrgMember = api.assignOrgMember;
export const removeOrgMember = api.removeOrgMember;

// -- platform --------------------------------------------------------------
export const getConnectors = api.getConnectors;
export const getIngestionRuns = api.getIngestionRuns;
export const triggerIngestionRun = api.triggerIngestionRun;
export const getRunStatus = api.getRunStatus;
export const getIngestionConfig = api.getIngestionConfig;
export const getActiveRuns = api.getActiveRuns;
export const getHealth = api.getHealth;
export const getReadiness = api.getReadiness;
