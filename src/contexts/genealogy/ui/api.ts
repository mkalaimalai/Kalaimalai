import type { Branch } from "@/shared/kernel";
import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runResult, runValue } from "@/store/query-fn";
import type {
  ChangeRequestDTO,
  PersonDTO,
  PersonProfileDTO,
  TreeDTO,
} from "../application/dtos";
import type {
  AddPersonInput,
  ApproveRelationshipChangeInput,
  EditPersonInput,
  ProposeRelationshipChangeInput,
} from "../application/inputs";

/**
 * RTK Query endpoints for the Genealogy context (AGENT_CONTRACTS §"RTK Query").
 * Each `queryFn` resolves the bound use case from the composition root and runs
 * it — RTK Query is a driving adapter, not the data source (TECHNICAL_DESIGN §7).
 */
export const genealogyApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTree: build.query<TreeDTO, { branch?: Branch } | void>({
      queryFn: (arg) =>
        runValue(getContainer().genealogy.getTree(arg?.branch)),
      providesTags: ["Tree"],
    }),
    getPersonProfile: build.query<PersonProfileDTO | null, string>({
      queryFn: (personId) =>
        runValue(getContainer().genealogy.getPersonProfile(personId)),
      providesTags: (_result, _err, personId) => [
        { type: "Person", id: personId },
      ],
    }),
    explainRelationship: build.query<string, { a: string; b: string }>({
      queryFn: ({ a, b }) =>
        runValue(getContainer().genealogy.explainRelationship(a, b)),
    }),
    listChangeRequests: build.query<ChangeRequestDTO[], void>({
      queryFn: () =>
        runValue(getContainer().genealogy.listChangeRequests()),
      providesTags: ["ChangeRequest"],
    }),

    addPerson: build.mutation<PersonDTO, AddPersonInput>({
      queryFn: (input) =>
        runResult(getContainer().genealogy.addPerson(input)),
      invalidatesTags: ["Tree", "Person"],
    }),
    editPerson: build.mutation<PersonDTO, EditPersonInput>({
      queryFn: (input) =>
        runResult(getContainer().genealogy.editPerson(input)),
      invalidatesTags: (_result, _err, input) => [
        "Tree",
        { type: "Person", id: input.id },
      ],
    }),
    proposeRelationshipChange: build.mutation<
      ChangeRequestDTO,
      ProposeRelationshipChangeInput
    >({
      queryFn: (input) =>
        runResult(getContainer().genealogy.proposeRelationshipChange(input)),
      invalidatesTags: ["ChangeRequest"],
    }),
    approveRelationshipChange: build.mutation<
      ChangeRequestDTO,
      ApproveRelationshipChangeInput
    >({
      queryFn: (input) =>
        runResult(getContainer().genealogy.approveRelationshipChange(input)),
      invalidatesTags: ["ChangeRequest", "Tree", "Relationship"],
    }),
  }),
});

export const {
  useGetTreeQuery,
  useGetPersonProfileQuery,
  useExplainRelationshipQuery,
  useListChangeRequestsQuery,
  useAddPersonMutation,
  useEditPersonMutation,
  useProposeRelationshipChangeMutation,
  useApproveRelationshipChangeMutation,
} = genealogyApi;
