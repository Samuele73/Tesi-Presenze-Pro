package com.tesi.presenzepro.calendar.repository;

import com.tesi.presenzepro.calendar.dto.ApprovalRequestTab;
import com.tesi.presenzepro.calendar.dto.OpenClosedRequestNumberResponse;
import com.tesi.presenzepro.calendar.model.CalendarEntity;
import com.tesi.presenzepro.calendar.model.RequestStatus;
import com.tesi.presenzepro.calendar.model.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CalendarRepositoryCustom {
    Page<CalendarEntity> findFilteredRequests(
            List<RequestType> requestTypes,
            List<String> userEmails,
            Pageable pageable,
            ApprovalRequestTab tab
    );

    OpenClosedRequestNumberResponse getOpenClosedRequestsNumber(List<String> usersEmails);

    Boolean updateRequestStatus(String id, RequestStatus newStatus);
}
