/**
 * Workspace Routes Component
 * Quản lý routing cho workspace pages
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import WorkspacePage from '../components/Workspaces/WorkspacePage';
import WorkspacePermissionGuard from '../components/Workspaces/WorkspacePermissionGuard';

// Lazy load các components
const WorkspaceCollections = lazy(() => import('../components/Workspaces/WorkspaceCollections'));
const WorkspaceMembers = lazy(() => import('../components/Workspaces/WorkspaceMembers'));
const WorkspaceActivity = lazy(() => import('../components/Workspaces/WorkspaceActivity'));
const WorkspaceAnalytics = lazy(() => import('../components/Workspaces/WorkspaceAnalytics'));
const WorkspaceTasks = lazy(() => import('../components/Workspaces/WorkspaceTasks'));
const WorkspaceDiscussions = lazy(() => import('../components/Workspaces/WorkspaceDiscussions'));
const WorkspaceLiveActivity = lazy(() => import('../components/Workspaces/WorkspaceLiveActivity'));
const WorkspaceSettings = lazy(() => import('../components/Workspaces/WorkspaceSettings'));
const RequestReviewQueue = lazy(() => import('../components/Workspaces/RequestReviewQueue'));
const ApiDocumentationGenerator = lazy(() => import('../components/Workspaces/ApiDocumentationGenerator'));
const ApiDesignDashboard = lazy(() => import('../components/Workspaces/ApiDesignDashboard'));
const ApiSchemaEditor = lazy(() => import('../components/Workspaces/ApiSchemaEditor'));
const ApiVersionManager = lazy(() => import('../components/Workspaces/ApiVersionManager'));
const ApiMockServer = lazy(() => import('../components/Workspaces/ApiMockServer'));
const ApiTestSuite = lazy(() => import('../components/Workspaces/ApiTestSuite'));
const ApiTemplateLibrary = lazy(() => import('../components/Workspaces/ApiTemplateLibrary'));
const ApiDesignReview = lazy(() => import('../components/Workspaces/ApiDesignReview'));
const CollectionDetailPage = lazy(() => import('../components/Workspaces/CollectionDetailPage'));
const CollectionRequestsView = lazy(() => import('../components/Workspaces/CollectionRequestsView'));
const CollectionRequestBuilder = lazy(() => import('../components/Workspaces/CollectionRequestBuilder'));
const CollectionDocumentationView = lazy(() => import('../components/Workspaces/CollectionDocumentationView'));

export default function WorkspaceRoutes() {
  return (
    <Routes>
      <Route
        path=":id"
        element={
          <WorkspacePermissionGuard>
            <WorkspacePage />
          </WorkspacePermissionGuard>
        }
      >
        {/* Default route - Dashboard */}
        <Route
          index
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <ApiDesignDashboard />
            </Suspense>
          }
        />
        {/* Collections route */}
        <Route
          path="collections"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <WorkspaceCollections />
            </Suspense>
          }
        />
        {/* Collection Detail routes */}
        <Route
          path="collections/:collectionId"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <CollectionDetailPage />
            </Suspense>
          }
        >
          <Route
            index
            element={<Navigate to="requests" replace />}
          />
          <Route
            path="requests"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                <CollectionRequestsView />
              </Suspense>
            }
          />
          <Route
            path="requests/:requestId"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                <CollectionRequestBuilder />
              </Suspense>
            }
          />
          <Route
            path="documentation"
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                <CollectionDocumentationView />
              </Suspense>
            }
          />
        </Route>
        {/* Members route - chỉ team workspace */}
        <Route
          path="members"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <WorkspaceMembers />
            </Suspense>
          }
        />
        {/* Activity route - chỉ team workspace */}
        <Route
          path="activity"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <WorkspaceActivity />
            </Suspense>
          }
        />
        {/* Analytics route - chỉ team workspace */}
        <Route
          path="analytics"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <WorkspaceAnalytics />
            </Suspense>
          }
        />
        {/* Tasks route - chỉ team workspace */}
        <Route
          path="tasks"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <WorkspaceTasks />
            </Suspense>
          }
        />
        {/* Discussions route - chỉ team workspace */}
        <Route
          path="discussions"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <WorkspaceDiscussions />
            </Suspense>
          }
        />
        {/* Live Activity route - chỉ team workspace */}
        <Route
          path="live"
          element={
            <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
              <WorkspaceLiveActivity />
            </Suspense>
          }
        />
                    {/* Review Queue route - chỉ team workspace */}
                    <Route
                      path="reviews"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <RequestReviewQueue />
                        </Suspense>
                      }
                    />
                    {/* Documentation route - chỉ team workspace */}
                    <Route
                      path="documentation"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <ApiDocumentationGenerator />
                        </Suspense>
                      }
                    />
                    {/* API Design routes - chỉ team workspace */}
                    <Route
                      path="api-schema"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <ApiSchemaEditor />
                        </Suspense>
                      }
                    />
                    <Route
                      path="api-versions"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <ApiVersionManager />
                        </Suspense>
                      }
                    />
                    <Route
                      path="api-mocking"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <ApiMockServer />
                        </Suspense>
                      }
                    />
                    <Route
                      path="api-testing"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <ApiTestSuite />
                        </Suspense>
                      }
                    />
                    <Route
                      path="api-templates"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <ApiTemplateLibrary />
                        </Suspense>
                      }
                    />
                    <Route
                      path="design-reviews"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <ApiDesignReview />
                        </Suspense>
                      }
                    />
                    {/* Settings route */}
                    <Route
                      path="settings"
                      element={
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải...</div>}>
                          <WorkspaceSettings />
                        </Suspense>
                      }
                    />
      </Route>
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
