import {
  type AlbumId,
  type ApproximateDate,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";

/**
 * Album — a grouping aggregate for memories (e.g. "Diwali 2019"), with an
 * optional approximate date (TECHNICAL_DESIGN §4.3). Memories reference an album
 * by id; the album does not own the member list (kept light, queried by filter).
 */

export interface AlbumProps {
  readonly id: AlbumId;
  readonly title: string;
  readonly date?: ApproximateDate;
}

export class Album {
  private constructor(
    readonly id: AlbumId,
    readonly title: string,
    readonly date: ApproximateDate | null,
  ) {}

  static create(props: AlbumProps): Result<Album> {
    const title = props.title.trim();
    if (title.length === 0) {
      return fail("ALBUM_TITLE_REQUIRED", "An album needs a title.");
    }
    return ok(new Album(props.id, title, props.date ?? null));
  }
}
