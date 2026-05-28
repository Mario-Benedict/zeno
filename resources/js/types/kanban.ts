// ─── Kanban Domain Types ─────────────────────────────────────────────────────

/**
 * Lightweight project shape used by the kanban page. Mirrors the payload
 * sent by `KanbanController::show` — separate from the richer `Project`
 * type in `@/types/project` which is used by the project listing.
 */
export interface KanbanProject {
    project_id: string;
    project_name: string;
    project_slug: string;
}

export interface KanbanUser {
    id: number;
    name: string;
    email: string;

    pivot?: {
        project_id: string;
        user_id: string;
        role: 'OWNER' | 'ADMIN' | 'MEMBER';
        is_pinned: boolean;
        opened_at: string;
    };
}

export interface CardLabelColor {
    card_label_color_id: string;
    card_label_color_hex: string;
    created_at: string;
    updated_at: string;
}

export interface CardLabelCategory {
    card_label_category_id: string;
    card_label_category_name: string;
    created_at: string;
    updated_at: string;
}

export interface CardLabel {
    card_label_id: string;
    card_label_project_id: string;
    card_label_category_id: string;
    card_label_color_id: string;
    card_label_name: string;
    color?: CardLabelColor;
    category?: CardLabelCategory;
    created_at: string;
    updated_at: string;
}

export interface KanbanBoardCardChecklistItem {
    kanban_board_card_checklist_item_id: string;
    kanban_board_card_checklist_id: string;
    kanban_board_card_checklist_item_name: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface KanbanBoardCardChecklist {
    kanban_board_card_checklist_id: string;
    kanban_board_card_checklist_detail_id: string;
    kanban_board_card_checklist_name: string;
    created_at: string;
    updated_at: string;
    items?: KanbanBoardCardChecklistItem[];
}

export interface KanbanBoardCardDate {
    kanban_board_card_date_id: string;
    kanban_board_card_detail_id: string;
    kanban_board_card_start_date: string | null;
    kanban_board_card_due_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface KanbanBoardCardAttachment {
    kanban_board_card_attachment_id: string;
    kanban_board_card_detail_id: string;
    kanban_board_card_attachment_name: string | null;
    kanban_board_card_attachment_url: string;
    created_at: string;
    updated_at: string;
}

export interface KanbanBoardCardComment {
    kanban_board_card_comment_id: string;
    kanban_board_card_detail_id: string;
    kanban_board_card_comment_from: number;
    kanban_board_card_comment_message: string;
    user?: KanbanUser;
    created_at: string;
    updated_at: string;
}

export interface KanbanBoardCardDetail {
    kanban_board_card_detail_id: string;
    kanban_board_card_id: string;
    kanban_board_card_title: string;
    kanban_board_card_description: string | null;
    is_completed: boolean;
    labels?: CardLabel[];
    members?: KanbanUser[];
    checklists?: KanbanBoardCardChecklist[];
    dates?: KanbanBoardCardDate;
    attachments?: KanbanBoardCardAttachment[];
    comments?: KanbanBoardCardComment[];
    created_at: string;
    updated_at: string;
}

export interface KanbanBoardCard {
    kanban_board_card_id: string;
    kanban_board_id: string;
    detail?: KanbanBoardCardDetail;
    created_at: string;
    updated_at: string;
}

export interface KanbanBoard {
    kanban_board_id: string;
    kanban_board_project_id: string;
    kanban_board_name: string;
    kanban_board_position: number | null;
    cards?: KanbanBoardCard[];
    created_at: string;
    updated_at: string;
}

export interface KanbanProps {
    project: KanbanProject;
    kanbanBoards: KanbanBoard[];
    cardLabelColors?: CardLabelColor[];
    cardLabelCategories?: CardLabelCategory[];
    projectUsers: KanbanUser[];
    currentUser: KanbanUser;
    cardLabels: CardLabel[];
    [key: string]: unknown;
}
