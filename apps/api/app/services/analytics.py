"""Analytics Service - Quality intelligence dashboard."""

import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.requirement import Requirement
from app.models.test_case import TestCase
from app.models.test_run import TestRun
from app.models.defect import Defect


def get_dashboard_stats(db: Session, project_id: uuid.UUID | None = None) -> dict:
    reqs = db.scalars(select(Requirement)).all()
    req_stats = {"total": len(reqs), "by_status": {}, "by_priority": {}}
    for req in reqs:
        req_stats["by_status"][req.status] = req_stats["by_status"].get(req.status, 0) + 1
        req_stats["by_priority"][req.priority] = req_stats["by_priority"].get(req.priority, 0) + 1
    
    tcs = db.scalars(select(TestCase)).all()
    tc_stats = {"total": len(tcs), "by_status": {}, "by_type": {}}
    for tc in tcs:
        tc_stats["by_status"][tc.status] = tc_stats["by_status"].get(tc.status, 0) + 1
        tc_stats["by_type"][tc.type] = tc_stats["by_type"].get(tc.type, 0) + 1
    
    runs = db.scalars(select(TestRun)).all()
    run_stats = {"total": len(runs), "by_status": {}, "avg_pass_rate": 0}
    total_pass_rate = 0
    for run in runs:
        run_stats["by_status"][run.status] = run_stats["by_status"].get(run.status, 0) + 1
        if run.total_cases and run.total_cases > 0:
            total_pass_rate += (run.passed / run.total_cases) * 100
    if len(runs) > 0:
        run_stats["avg_pass_rate"] = round(total_pass_rate / len(runs), 2)
    
    defs = db.scalars(select(Defect)).all()
    def_stats = {"total": len(defs), "by_status": {}, "by_severity": {}}
    for d in defs:
        def_stats["by_status"][d.status] = def_stats["by_status"].get(d.status, 0) + 1
        def_stats["by_severity"][d.severity] = def_stats["by_severity"].get(d.severity, 0) + 1
    
    quality_score = 0
    if req_stats["total"] > 0:
        approved_reqs = req_stats["by_status"].get("Approved", 0) + req_stats["by_status"].get("Baseline", 0)
        quality_score += (approved_reqs / req_stats["total"]) * 25
    if tc_stats["total"] > 0:
        approved_tcs = tc_stats["by_status"].get("Approved", 0)
        quality_score += (approved_tcs / tc_stats["total"]) * 25
    if run_stats["total"] > 0:
        quality_score += (run_stats["avg_pass_rate"] / 100) * 25
    if def_stats["total"] > 0:
        closed_defs = def_stats["by_status"].get("Closed", 0) + def_stats["by_status"].get("Resolved", 0)
        quality_score += (closed_defs / def_stats["total"]) * 25
    
    return {"requirements": req_stats, "test_cases": tc_stats, "test_runs": run_stats, "defects": def_stats, "quality_score": round(quality_score, 2)}
