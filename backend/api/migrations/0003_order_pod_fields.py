from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_product_address'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='pod_code_hash',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='pod_verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
