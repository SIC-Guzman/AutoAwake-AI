from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database.autoawake_db import (
    Database,
    open_issue,
    close_issue,
    update_issue_status,
    list_issues
)
from schemas.crud_schemas import IssueOpen, IssueResponse
from utils.security import get_current_user
from utils.db_instance import get_db_instance

router = APIRouter(prefix="/issues", tags=["Issues"])

@router.post("/")
def create_issue(
    issue: IssueOpen,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    try:
        open_issue(
            db,
            issue.vehicle_id,
            issue.driver_id,
            issue.trip_id,
            issue.issue_type,
            issue.description
        )
        return {"message": "Issue opened successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{issue_id}/status")
def update_existing_issue_status(
    issue_id: int,
    new_status: str,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    try:
        if new_status not in ['IN_PROGRESS', 'CLOSED']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be IN_PROGRESS or CLOSED"
            )
        update_issue_status(db, issue_id, new_status)
        return {"message": f"Issue status updated to {new_status} successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{issue_id}/close")
def close_existing_issue(
    issue_id: int,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    try:
        close_issue(db, issue_id)
        return {"message": "Issue closed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[IssueResponse])
def get_all_issues(
    status: str = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db_instance)
):
    return list_issues(db, status, limit)
