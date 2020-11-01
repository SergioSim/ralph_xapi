"""URL's for events"""

from django.urls import path

from . import views

# pylint: disable=invalid-name

app_name = "event"
urlpatterns = [
    path("", views.EventListCreate.as_view()),
    path("<int:pk>", views.EventDetail.as_view()),
    path("field/", views.EventFieldListCreate.as_view()),
    path("field/<int:pk>", views.EventFieldDetail.as_view()),
    path("nature/ipv4/", views.IPv4NatureListCreate.as_view()),
    path("nature/ipv4/<int:pk>", views.IPv4NatureDetail.as_view()),
    path("nature/url/", views.UrlNatureListCreate.as_view()),
    path("nature/url/<int:pk>", views.UrlNatureDetail.as_view()),
    path("nature/integer/", views.IntegerNatureListCreate.as_view()),
    path("nature/integer/<int:pk>", views.IntegerNatureDetail.as_view()),
]
