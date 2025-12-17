/**
 * Collection Routes Component
 * Quản lý routing cho collection pages
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load các components
const CollectionDetailPage = lazy(() => import('../components/Collections/CollectionDetailPage'));
const CollectionRequestsView = lazy(() => import('../components/Collections/CollectionRequestsView'));
const CollectionRequestBuilder = lazy(() => import('../components/RequestBuilder/BaseRequestBuilder'));
const CollectionDocumentationView = lazy(() => import('../components/Collections/CollectionDocumentation'));
const CollectionMembers = lazy(() => import('../components/Collections/CollectionMembers'));
const CollectionTasks = lazy(() => import('../components/Collections/CollectionTasks'));
const CollectionDiscussions = lazy(() => import('../components/Collections/CollectionDiscussions'));
const CollectionReviews = lazy(() => import('../components/Collections/CollectionReviews'));
const CollectionActivity = lazy(() => import('../components/Collections/CollectionActivity'));

export default function CollectionRoutes() {
  return (
    <Routes>
      <Route
        path=":id"
        element={
          <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
            <CollectionDetailPage />
          </Suspense>
        }
      >
        {/* Default route - Requests */}
        <Route
          index
          element={<Navigate to="requests" replace />}
        />
        {/* Requests route */}
        <Route
          path="requests"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionRequestsView />
            </Suspense>
          }
        />
        {/* Request Builder route */}
        <Route
          path="requests/:requestId"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionRequestBuilder />
            </Suspense>
          }
        />
        {/* Documentation route */}
        <Route
          path="documentation"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionDocumentationView />
            </Suspense>
          }
        />
        {/* Members route */}
        <Route
          path="members"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionMembers />
            </Suspense>
          }
        />
        {/* Tasks route */}
        <Route
          path="tasks"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionTasks />
            </Suspense>
          }
        />
        {/* Discussions route */}
        <Route
          path="discussions"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionDiscussions />
            </Suspense>
          }
        />
        {/* Reviews route */}
        <Route
          path="reviews"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionReviews />
            </Suspense>
          }
        />
        {/* Activity route */}
        <Route
          path="activity"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionActivity />
            </Suspense>
          }
        />
      </Route>
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
