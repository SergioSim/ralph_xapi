"""URL's for events"""

from django.urls import path

from . import views

app_name = "event"
urlpatterns = [
    path('', views.EventListCreate.as_view()),
    path('/<int:pk>', views.EventDetail.as_view()),
]