from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_order_shipping_adjustments'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='additional_shipping_paid',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='order',
            name='additional_shipping_payment_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='additional_shipping_signature',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
