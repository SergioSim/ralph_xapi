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
    path("xapi/", views.XAPIFieldListCreate.as_view()),
    path("xapi/<int:pk>", views.XAPIFieldDetail.as_view()),
    path("nature/ipv4/", views.IPv4NatureListCreate.as_view()),
    path("nature/ipv4/<int:pk>", views.IPv4NatureDetail.as_view()),
    path("nature/url/", views.UrlNatureListCreate.as_view()),
    path("nature/url/<int:pk>", views.UrlNatureDetail.as_view()),
    path("nature/integer/", views.IntegerNatureListCreate.as_view()),
    path("nature/integer/<int:pk>", views.IntegerNatureDetail.as_view()),
    path("nature/list/", views.ListNatureListCreate.as_view()),
    path("nature/list/<int:pk>", views.ListNatureDetail.as_view()),
    path("nature/dict/", views.DictNatureListCreate.as_view()),
    path("nature/dict/<int:pk>", views.DictNatureDetail.as_view()),
    path("nature/nested/", views.NestedNatureListCreate.as_view()),
    path("nature/nested/<int:pk>", views.NestedNatureDetail.as_view()),
    path("test/field/", views.EventFieldTestListCreate.as_view()),
    path("test/field/<int:pk>", views.EventFieldTestDetail.as_view()),
    path("test/field/event/<int:field_id>", views.test_field_by_event),
    path("code/field/<int:pk>", views.code_field),
    path("code/event/<int:pk>", views.code_schema)
]
