"""Front end views"""

from django.shortcuts import render

# Create your views here.

def index(request):
    """Intex"""
    return render(request, 'frontend/index.html')