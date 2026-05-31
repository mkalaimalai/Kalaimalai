export * from "./genealogy.module";
export type {
  PersonDTO,
  RelationshipDTO,
  TreeDTO,
  PersonProfileDTO,
  ResolvedRelationshipDTO,
  ChangeRequestDTO,
} from "./application/dtos";
export type {
  AddPersonInput,
  EditPersonInput,
  ProposeRelationshipChangeInput,
  ApproveRelationshipChangeInput,
} from "./application/inputs";

import type { GenealogyModule } from "./genealogy.module";

declare module "@/bootstrap/container" {
  interface AppContainer {
    genealogy: GenealogyModule;
  }
}
