import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  ActionSheetController,
  LoadingController,
  ModalController,
  NavController,
} from "@ionic/angular";
import { Subscription } from "rxjs";
import { AuthService } from 'src/app/auth/auth.service';
import { BookingServicie } from "src/app/bookings/booking.service";
import { CreateBookingComponent } from "src/app/bookings/create-booking/create-booking.component";
import { Place } from "../../place.model";
import { PlacesService } from "../../places.service";

@Component({
  selector: "app-place-detail",
  templateUrl: "./place-detail.page.html",
  styleUrls: ["./place-detail.page.scss"],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  isBookeable = false;
  private placeSub: Subscription;

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingServicie,
    private loadingCtrl: LoadingController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has("placeId")) {
        this.navCtrl.navigateBack("/places/tabs/discover");
        return;
      }
      this.placeSub = this.placesService
        .getPlace(paramMap.get("placeId"))
        .subscribe((place) => {
          this.place = place;
          this.isBookeable = place.userId !== this.authService.getUserId();
        });
    });
  }

  onBookPlace() {
    this.actionSheetCtrl
      .create({
        header: "Choose an Action",
        buttons: [
          {
            text: "Select Date",
            handler: () => {
              this.openBookingModal("select");
            },
          },
          {
            text: "Random Date",
            handler: () => {
              this.openBookingModal("random");
            },
          },
          {
            text: "Cancel",
            role: "cancel",
          },
        ],
      })
      .then((actionSheetEl) => {
        actionSheetEl.present();
      });
  }

  openBookingModal(mode: "select" | "random") {
    console.log(),
      this.modalCtrl
        .create({
          component: CreateBookingComponent,
          componentProps: { selectedPlace: this.place, selectedMode: mode },
        })
        .then((modalEl) => {
          modalEl.present();
          return modalEl.onDidDismiss();
        })
        .then((resultData) => {
          if (resultData.role === "confirm") {
            this.loadingCtrl
              .create({
                message: "Booking place...",
              })
              .then((loadingEl) => {
                loadingEl.present();
                const data = resultData.data.bookingDate;
                this.bookingService.addBooking(
                  this.place.id,
                  this.place.title,
                  this.place.imageUrl,
                  data.firstName,
                  data.lastName,
                  data.guestNumber,
                  data.startDate,
                  data.endDate
                ).subscribe( () => {
                  loadingEl.dismiss();
                });
              });
          }
        });
  }

  ngOnDestroy() {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }
}
