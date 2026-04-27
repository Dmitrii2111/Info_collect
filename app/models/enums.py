from enum import Enum


class UserRole(str, Enum):
    OPERATOR = "operator"
    DISPATCHER = "dispetcher"
    ADMIN = "admin"


class CategoryCode(str, Enum):
    MEDICAL = "medical"
    FURNITURE = "furniture"


class PlanVersionStatus(str, Enum):
    DRAFT = "draft"
    DIFF_READY = "diff_ready"
    APPROVED = "approved"
    APPLIED = "applied"
    REJECTED = "rejected"


class ImportType(str, Enum):
    INITIAL_PLAN = "initial_plan"
    PLAN_UPDATE = "plan_update"
    WAREHOUSE_RECEIPT = "warehouse_receipt"


class ImportStatus(str, Enum):
    STARTED = "started"
    COMPLETED = "completed"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
    FAILED = "failed"


class ImportRowStatus(str, Enum):
    IMPORTED = "imported"
    SKIPPED = "skipped"
    WARNING = "warning"
    ERROR = "error"


class ItemPresenceStatus(str, Enum):
    NOT_CHECKED = "not_checked"
    FOUND = "found"
    MISSING = "missing"
    IN_STORAGE = "in_storage"
    MOVED_TO_ROOM = "moved_to_room"
    AWAITING_REPEAT_CHECK = "awaiting_repeat_check"
    CONFLICT = "conflict"


class SerialState(str, Enum):
    SERIAL_ENTERED = "serial_entered"
    NOT_PROVIDED = "not_provided"
    UNKNOWN = "unknown"


class PnrStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    NOT_DONE = "not_done"
    DONE = "done"
    INSTALLATION = "installation"


class CommunicationsStatus(str, Enum):
    MISSING = "missing"
    DONE = "done"
    DONE_WITH_ERRORS = "done_with_errors"
    NOT_PROVIDED = "not_provided"


class CheckType(str, Enum):
    INITIAL_CHECK = "initial_check"
    REPEAT_CHECK = "repeat_check"
    OPERATOR_CORRECTION = "operator_correction"


class RepeatCheckScope(str, Enum):
    ROOM = "room"
    ITEM = "item"


class RepeatCheckStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ConflictType(str, Enum):
    PRESENCE_MISMATCH = "presence_mismatch"
    SERIAL_MISMATCH = "serial_mismatch"
    PNR_MISMATCH = "pnr_mismatch"
    COMMUNICATIONS_MISMATCH = "communications_mismatch"
    PARALLEL_ROOM_ACTIVITY = "parallel_room_activity"
    RECEIPT_SHORTAGE = "receipt_shortage"
    RECEIPT_SURPLUS = "receipt_surplus"
    UNPLANNED_RECEIPT = "unplanned_receipt"
    LOCATION_MISMATCH = "location_mismatch"


class ConflictStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ReceiptStatus(str, Enum):
    DRAFT = "draft"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    PARTIALLY_CONFIRMED = "partially_confirmed"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class ReceiptItemStatus(str, Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    SHORTAGE = "shortage"
    SURPLUS = "surplus"
    UNPLANNED = "unplanned"


class PlacementStatus(str, Enum):
    AWAITING_PLACEMENT = "awaiting_placement"
    PLACED_TO_STOCK = "placed_to_stock"
    PLACED_TO_ROOM = "placed_to_room"
    PARTIALLY_PLACED = "partially_placed"


class ConditionStatus(str, Enum):
    GOOD = "good"
    DAMAGED = "damaged"
    REQUIRES_INSPECTION = "requires_inspection"
    INCOMPLETE = "incomplete"
    OTHER = "other"


class StorageZoneType(str, Enum):
    PHYSICAL = "physical"
    SURPLUS = "surplus"
    AWAITING_PLACEMENT = "awaiting_placement"
    QUARANTINE = "quarantine"


class FollowUpTaskType(str, Enum):
    SUPPLY_SHORTAGE = "supply_shortage"


class FollowUpTaskStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


class MovementType(str, Enum):
    RECEIPT_TO_STOCK = "receipt_to_stock"
    STOCK_TO_STOCK = "stock_to_stock"
    STOCK_TO_ROOM = "stock_to_room"
    ROOM_TO_STOCK = "room_to_stock"
    STOCK_RELOCATION = "stock_relocation"


class ChangeSetStatus(str, Enum):
    DRAFT = "draft"
    READY_FOR_REVIEW = "ready_for_review"
    APPROVED = "approved"
    APPLIED = "applied"
    CANCELLED = "cancelled"


class ChangeType(str, Enum):
    ROOM_ADDED = "room_added"
    ROOM_REMOVED = "room_removed"
    ROOM_RENAMED = "room_renamed"
    POSITION_ADDED = "position_added"
    POSITION_REMOVED = "position_removed"
    POSITION_CHANGED = "position_changed"
    QUANTITY_CHANGED = "quantity_changed"
    POSITION_MOVED = "position_moved"
    POSITION_SPLIT = "position_split"
    POSITION_MERGED = "position_merged"
    UNMATCHED = "unmatched"


class ChangeResolutionStatus(str, Enum):
    PENDING = "pending"
    AUTO_MATCHED = "auto_matched"
    REQUIRES_REVIEW = "requires_review"
    APPROVED = "approved"
    APPLIED = "applied"
    REJECTED = "rejected"


class ChangeResolutionAction(str, Enum):
    CREATE_NEW = "create_new"
    ARCHIVE_OLD = "archive_old"
    RELINK_ITEMS = "relink_items"
    INCREASE_INSTANCES = "increase_instances"
    DECREASE_INSTANCES = "decrease_instances"
    MOVE_ROOM = "move_room"
    MANUAL_RESOLUTION = "manual_resolution"


class SyncBatchStatus(str, Enum):
    RECEIVED = "received"
    PROCESSED = "processed"
    PROCESSED_WITH_ERRORS = "processed_with_errors"
    FAILED = "failed"


class ExportType(str, Enum):
    FINAL_PLAN_REPORT = "final_plan_report"
    ITEM_REPORT = "item_report"
    STOCK_REPORT = "stock_report"
    USER_ACTIVITY_REPORT = "user_activity_report"
    CONFLICT_REPORT = "conflict_report"
    REPEAT_CHECK_REPORT = "repeat_check_report"
