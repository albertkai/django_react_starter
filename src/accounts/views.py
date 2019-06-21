from django.shortcuts import get_object_or_404
from django_rest_logger import log
from knox.auth import TokenAuthentication
from knox.models import AuthToken
from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime
from json import dump
import json  # library for manipulating JSON files
import logging
import sys
from textblob import TextBlob  # library for sentiment analysis
from twitterscraper import query_tweets  # library for scraping

from accounts.models import User
from accounts.serializers import UserRegistrationSerializer, UserSerializer
from lib.utils import AtomicMixin


class JSONEncoder(json.JSONEncoder):
    """custom json encoder."""

    def default(self, obj):
        """default method."""
        if hasattr(obj, '__json__'):
            return obj.__json__()
        elif isinstance(obj, collections.Iterable):
            return list(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        elif hasattr(obj, '__getitem__') and hasattr(obj, 'keys'):
            return dict(obj)
        elif hasattr(obj, '__dict__'):
            return {member: getattr(obj, member)
                    for member in dir(obj)
                    if not member.startswith('_') and
                    not hasattr(getattr(obj, member), '__call__')}

        return json.JSONEncoder.default(self, obj)

class UserRegisterView(AtomicMixin, CreateModelMixin, GenericAPIView):
    serializer_class = UserRegistrationSerializer
    authentication_classes = ()

    def post(self, request):
        """User registration view."""
        return self.create(request)

class GetSentimentsView(AtomicMixin, CreateModelMixin, GenericAPIView):
    serializer_class = None
    authentication_classes = ()

    def get(self, request):
        """Sentiment analysis"""
        topic = self.request.query_params.get('topic')
        """tweets = query_tweets('clinton' + '%20from%3A' + '' + '%20since%3A' + '2018-04-04' + 'until%3A' + '2018-04-05', 10)"""
        tweets = query_tweets(topic, 100)
        logging.debug(tweets)
        tweets_processed = []
        positive = 0
        negative = 0
        neutral = 0
        for tweet in tweets:
            analysis = TextBlob(tweet.text)
            label = ''
            if analysis.sentiment[0] > 0:
                label = 'Positive'
                positive += 1
            elif analysis.sentiment[0] < 0:
                label = 'Negative'
                negative += 1
            else:
                neutral += 1
                label = 'Neutral'
            tweets_processed.append({
                'text': tweet.text,
                'user': tweet.user,
                'label': label,
                'sentiment_raw': analysis.sentiment
            })

        return Response({
            'hello': 'world',
            'processed': tweets_processed,
            'positive': positive,
            'negative': negative,
            'neutral': neutral
        })

class UserLoginView(GenericAPIView):
    serializer_class = UserSerializer
    authentication_classes = (BasicAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        """User login with username and password."""
        token = AuthToken.objects.create(request.user)
        return Response({
            'user': self.get_serializer(request.user).data,
            'token': token
        })


class UserConfirmEmailView(AtomicMixin, GenericAPIView):
    serializer_class = None
    authentication_classes = ()

    def get(self, request, activation_key):
        """
        View for confirm email.

        Receive an activation key as parameter and confirm email.
        """
        user = get_object_or_404(User, activation_key=str(activation_key))
        if user.confirm_email():
            return Response(status=status.HTTP_200_OK)

        log.warning(message='Email confirmation key not found.',
                    details={'http_status_code': status.HTTP_404_NOT_FOUND})
        return Response(status=status.HTTP_404_NOT_FOUND)


class UserEmailConfirmationStatusView(GenericAPIView):
    serializer_class = None
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        """Retrieve user current confirmed_email status."""
        user = self.request.user
        return Response({'status': user.confirmed_email}, status=status.HTTP_200_OK)
