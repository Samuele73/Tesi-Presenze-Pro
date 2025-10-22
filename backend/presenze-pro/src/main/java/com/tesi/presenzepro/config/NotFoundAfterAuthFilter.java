package com.tesi.presenzepro.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;

@Component
public class NotFoundAfterAuthFilter extends OncePerRequestFilter {

    private final RequestMappingHandlerMapping handlerMapping;

    public NotFoundAfterAuthFilter(RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Controllo per rotte non dichiarate
            if (handlerMapping.getHandler(request) == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.setContentType("application/json");
                response.getWriter().write("""
                    {
                      "status": 404,
                      "error": "Not Found",
                      "message": "The requested endpoint does not exist",
                      "path": "%s"
                    }
                    """.formatted(request.getRequestURI()));
                return;
            }
        } catch (Exception e) {
            logger.debug("Error checking handler for path: " + path, e);
        }
        filterChain.doFilter(request, response);
    }
}