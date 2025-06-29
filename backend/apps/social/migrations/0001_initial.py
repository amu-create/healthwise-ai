# Generated by Django 5.2.3 on 2025-06-26 15:33

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('api', '0008_alter_userworkoutachievement_options_and_more'),
        ('workout', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Conversation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('participants', models.ManyToManyField(related_name='conversations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'social_conversation',
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='SocialPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('visibility', models.CharField(choices=[('public', '전체 공개'), ('followers', '팔로워만'), ('private', '나만 보기')], default='public', max_length=20)),
                ('exercise_name', models.CharField(blank=True, max_length=100)),
                ('duration', models.IntegerField(blank=True, help_text='운동 시간(분)', null=True)),
                ('calories_burned', models.IntegerField(blank=True, null=True)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('media_file', models.FileField(blank=True, null=True, upload_to='social/posts/%Y/%m/')),
                ('media_type', models.CharField(blank=True, choices=[('image', '이미지'), ('video', '동영상'), ('gif', 'GIF')], max_length=10, null=True)),
                ('media_url', models.URLField(blank=True, help_text='외부 미디어 URL (YouTube, GIF 등)', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('likes', models.ManyToManyField(blank=True, related_name='social_liked_posts', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_posts', to=settings.AUTH_USER_MODEL)),
                ('workout_log', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.workoutroutinelog')),
                ('workout_result', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='workout.workoutresult')),
            ],
            options={
                'db_table': 'social_workout_post',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SocialNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('like', '좋아요'), ('comment', '댓글'), ('follow', '팔로우'), ('friend_request', '친구 요청'), ('achievement', '업적 달성'), ('workout_reminder', '운동 알림')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('from_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='social_sent_notifications', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_notifications', to=settings.AUTH_USER_MODEL)),
                ('post', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='social.socialpost')),
            ],
            options={
                'db_table': 'social_notification',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SocialComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='social.socialcomment')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_comments', to=settings.AUTH_USER_MODEL)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='social.socialpost')),
            ],
            options={
                'db_table': 'social_comment',
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='SocialProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bio', models.TextField(blank=True, null=True)),
                ('profile_picture', models.ImageField(blank=True, null=True, upload_to='profiles/')),
                ('is_private', models.BooleanField(default=False)),
                ('show_achievement_badges', models.BooleanField(default=True)),
                ('show_workout_stats', models.BooleanField(default=True)),
                ('total_posts', models.IntegerField(default=0)),
                ('total_workouts', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('followers', models.ManyToManyField(blank=True, related_name='social_following', to=settings.AUTH_USER_MODEL)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='social_profile_obj', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'social_user_profile',
            },
        ),
        migrations.CreateModel(
            name='Story',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('media_file', models.FileField(max_length=500, upload_to='stories/')),
                ('media_type', models.CharField(choices=[('image', 'Image'), ('video', 'Video')], default='image', max_length=10)),
                ('caption', models.TextField(blank=True, max_length=500, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('is_highlight', models.BooleanField(default=False)),
                ('highlight_title', models.CharField(blank=True, max_length=50, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='stories', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Story',
                'verbose_name_plural': 'Stories',
                'db_table': 'social_story',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='DirectMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField(max_length=1000)),
                ('media_file', models.FileField(blank=True, max_length=500, null=True, upload_to='dm/media/%Y/%m/')),
                ('media_type', models.CharField(blank=True, choices=[('image', 'Image'), ('video', 'Video'), ('audio', 'Audio'), ('file', 'File')], max_length=10, null=True)),
                ('is_read', models.BooleanField(default=False)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('message_type', models.CharField(choices=[('text', 'Text Message'), ('story_reaction', 'Story Reaction'), ('post_share', 'Post Share'), ('media', 'Media')], default='text', max_length=20)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='social.conversation')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL)),
                ('referenced_post', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dm_shares', to='social.socialpost')),
                ('referenced_story', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dm_references', to='social.story')),
            ],
            options={
                'db_table': 'social_direct_message',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='StoryReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('emoji', models.CharField(blank=True, max_length=10, null=True)),
                ('message', models.TextField(blank=True, max_length=500, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('story', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='social.story')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='story_reactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'social_story_reaction',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='StoryView',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('viewed_at', models.DateTimeField(auto_now_add=True)),
                ('story', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='views', to='social.story')),
                ('viewer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='story_views', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'social_story_view',
                'ordering': ['-viewed_at'],
            },
        ),
        migrations.CreateModel(
            name='MessageReaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('emoji', models.CharField(max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='social.directmessage')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='message_reactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'social_message_reaction',
                'unique_together': {('message', 'user', 'emoji')},
            },
        ),
        migrations.CreateModel(
            name='SocialFriendRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', '대기중'), ('accepted', '수락됨'), ('rejected', '거절됨')], default='pending', max_length=20)),
                ('message', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('responded_at', models.DateTimeField(blank=True, null=True)),
                ('from_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_sent_friend_requests', to=settings.AUTH_USER_MODEL)),
                ('to_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_received_friend_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'social_friend_request',
                'unique_together': {('from_user', 'to_user')},
            },
        ),
        migrations.CreateModel(
            name='SavedPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_posts', to=settings.AUTH_USER_MODEL)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='saved_by', to='social.socialpost')),
            ],
            options={
                'db_table': 'social_saved_post',
                'ordering': ['-created_at'],
                'unique_together': {('user', 'post')},
            },
        ),
        migrations.AddIndex(
            model_name='story',
            index=models.Index(fields=['-created_at'], name='social_stor_created_0eee3f_idx'),
        ),
        migrations.AddIndex(
            model_name='story',
            index=models.Index(fields=['expires_at'], name='social_stor_expires_2883fe_idx'),
        ),
        migrations.AddIndex(
            model_name='story',
            index=models.Index(fields=['user', '-created_at'], name='social_stor_user_id_09a55d_idx'),
        ),
        migrations.AddIndex(
            model_name='directmessage',
            index=models.Index(fields=['conversation', '-created_at'], name='social_dire_convers_4a82b8_idx'),
        ),
        migrations.AddIndex(
            model_name='directmessage',
            index=models.Index(fields=['sender', '-created_at'], name='social_dire_sender__921d33_idx'),
        ),
        migrations.AddIndex(
            model_name='directmessage',
            index=models.Index(fields=['is_read', 'conversation'], name='social_dire_is_read_f8ac04_idx'),
        ),
        migrations.AddIndex(
            model_name='storyreaction',
            index=models.Index(fields=['story', '-created_at'], name='social_stor_story_i_279569_idx'),
        ),
        migrations.AddIndex(
            model_name='storyview',
            index=models.Index(fields=['story', 'viewer'], name='social_stor_story_i_940503_idx'),
        ),
        migrations.AddIndex(
            model_name='storyview',
            index=models.Index(fields=['-viewed_at'], name='social_stor_viewed__7dfbe6_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='storyview',
            unique_together={('story', 'viewer')},
        ),
    ]
