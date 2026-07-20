export type BoardSummary = {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  columnCount: number;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  user: SessionUser;
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: string;
  };
};

export type CardDetail = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ColumnDetail = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  cards: CardDetail[];
};

export type BoardDetail = {
  board: BoardSummary;
  columns: ColumnDetail[];
};
