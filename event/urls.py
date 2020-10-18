"""URL's for events"""

from django.urls import path

from . import views

app_name = "event"
urlpatterns = [
    # path('', views.IndexView.as_view(), name="index"),
    path('', views.EventListCreate.as_view(), name='index'),
    path('<int:pk>', views.ShowView.as_view(), name='show'),
    path('create', views.create, name='create'),
    path('<int:pk>/edit', views.EditView.as_view(), name="edit"),
    path('store', views.store, name="store")
]